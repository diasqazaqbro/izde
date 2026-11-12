# Архитектура

## Целевая схема

```
Браузер
  └─ frontend (Next.js)
       └─ backend (NestJS): вход, поиск, чат, тарифы и лимиты
            ├─ ml (Python, FastAPI): разбор файлов, эмбеддинги
            ├─ PostgreSQL + pgvector: документы, фрагменты, векторы, пользователи, планы
            ├─ облачный LLM API: текст ответа по найденным фрагментам
            └─ заглушка оплаты
```

## Фаза 1: только frontend

Бэкенда нет. Экраны получают данные только через `src/lib/api`. У слоя один интерфейс и две реализации: мок (сейчас) и HTTP (позже). Экраны не знают, какая из них работает.

### Структура

```
frontend/
  src/
    app/
      (auth)/login/page.tsx
      (app)/layout.tsx              шапка, проверка входа
      (app)/page.tsx                поиск (главная)
      (app)/search/page.tsx         результаты: ?q=&mode=
      (app)/docs/[id]/page.tsx      карточка документа: ?clause=
      (app)/chat/page.tsx           новый чат
      (app)/chat/[id]/page.tsx      диалог
      (app)/pricing/page.tsx        тарифы и заглушка оплаты
      (app)/admin/layout.tsx        вкладки, доступ только админу
      (app)/admin/page.tsx          сводка
      (app)/admin/documents/page.tsx
      (app)/admin/analytics/page.tsx
      (app)/admin/users/page.tsx
    components/
      ui/        кнопка, поле, сегменты, статус, панель, диалог
      search/    поле поиска, блок ответа, строка результата, фильтры
      chat/      история, сообщение, поле ввода, шаги, ссылка, панель источника
      admin/     таблица документов, загрузка, карточки сводки
    lib/
      api/       types.ts, index.ts, mock/…
      i18n/      ru.ts, kk.ts, en.ts, хук для строк
      auth/      мок-сессия
    styles/      токены
```

### Маршруты и доступ

- Без входа доступен только `/login`. Остальное перенаправляет на вход.
- `/admin/*` и `/pricing` доступны только роли `admin`.
- Перехват запросов для проверки входа делай так, как это принято в установленной версии Next.js (в 16-й версии файл и его название менялись: проверь документацию).
- На фазе 1 сессия — мок: роль хранится в cookie, пароль не проверяется.

### Состояние в адресе

Запрос, режим и фильтры живут в параметрах URL (`/search?q=…&mode=meaning`), чтобы страницей результатов можно было поделиться и работала кнопка «назад».

## Типы

```ts
type Lang = 'ru' | 'kk' | 'en';
type Role = 'student' | 'staff' | 'admin';
type SearchMode = 'meaning' | 'keyword';
type DocStatus = 'ready' | 'queued' | 'processing' | 'failed';

interface Doc {
  id: string;
  title: string;
  code: string | null;
  lang: Lang;
  org: string;
  sourceUrl: string;
  status: DocStatus;
  sections: string[];
}

interface Clause {
  id: string;
  docId: string;
  number: string;      // "п. 15.3"
  section: string;
  text: string;        // дословная цитата
}

interface SearchHit {
  clause: Clause;
  doc: Doc;
  score: number;
  highlights: string[];
}

interface SearchResult {
  hits: SearchHit[];
  answer: { text: string; citations: Citation[] } | null;  // только в режиме meaning
}

interface Citation { index: number; clauseId: string; docId: string; }

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  citations: Citation[];
  stopped?: boolean;
  feedback?: 'up' | 'down';
  createdAt: string;
}

interface Chat {
  id: string;
  title: string;
  scope: { type: 'all' } | { type: 'doc'; docId: string };
  messages: ChatMessage[];
  updatedAt: string;
}

type ChatEvent =
  | { type: 'status'; text: string; docs?: string[] }
  | { type: 'token'; text: string }
  | { type: 'citation'; citation: Citation }
  | { type: 'suggestions'; items: string[] }
  | { type: 'done' }
  | { type: 'error'; message: string };

interface Plan { id: 'free' | 'standard' | 'campus'; name: string; docLimit: number; priceLabel: string; }
```

## Интерфейс слоя данных

```ts
interface Api {
  login(email: string, password: string, role: Role): Promise<{ email: string; role: Role }>;
  logout(): Promise<void>;

  search(q: string, mode: SearchMode, filters?: Filters): Promise<SearchResult>;
  getDoc(id: string): Promise<{ doc: Doc; clauses: Clause[] }>;

  listChats(): Promise<Chat[]>;
  getChat(id: string): Promise<Chat>;
  createChat(scope: Chat['scope'], seed?: ChatMessage[]): Promise<Chat>;
  renameChat(id: string, title: string): Promise<void>;
  deleteChat(id: string): Promise<void>;
  sendMessage(chatId: string, text: string, signal: AbortSignal): AsyncIterable<ChatEvent>;
  setFeedback(chatId: string, messageId: string, value: 'up' | 'down'): Promise<void>;

  listDocs(): Promise<Doc[]>;
  uploadDoc(file: File): Promise<Doc>;        // на фазе 1 возвращает ошибку «загрузка отключена в демо»
  getUsage(): Promise<{ plan: Plan; docCount: number }>;
  listPlans(): Promise<Plan[]>;
  checkout(planId: Plan['id']): Promise<{ ok: boolean }>;   // заглушка
}
```

`sendMessage` отдаёт события по мере поступления. В мок-реализации это генератор с задержками, позже — поток событий с сервера (SSE). `signal` нужен для кнопки «Стоп».

## Будущий контракт HTTP

| Метод и путь | Что делает |
|---|---|
| `POST /auth/login`, `POST /auth/logout` | вход и выход |
| `GET /search?q=&mode=&type=&year=&dept=` | поиск |
| `GET /docs`, `GET /docs/:id` | список и карточка |
| `POST /docs` | загрузка файла |
| `GET /chats`, `POST /chats`, `GET /chats/:id`, `PATCH /chats/:id`, `DELETE /chats/:id` | диалоги |
| `POST /chats/:id/messages` | ответ потоком событий (SSE) |
| `POST /chats/:id/messages/:mid/feedback` | отметка «Полезно / Не то» |
| `GET /billing/plans`, `GET /billing/usage`, `POST /billing/checkout` | тарифы |
| `GET /admin/analytics` | статистика запросов |

## Языки интерфейса

Три словаря: `ru` (основной), `kk`, `en`. Язык хранится в cookie и переключается в шапке. Маршруты без языкового префикса. На фазе 1 `kk` и `en` можно заполнить частично, с откатом на `ru`, но все строки должны идти через словарь.
