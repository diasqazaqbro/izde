# Архитектура

Документ описывает то, что сейчас лежит в коде. Источник истины для типов — `frontend/src/lib/api/types.ts`; при расхождении прав код, а этот файл нужно поправить.

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

Бэкенда нет. Экраны получают данные только через `src/lib/api`. Интерфейс `Api` один; сейчас его реализует мок (`lib/api/mock`), в фазе 2 — HTTP-клиент. Реализация выбирается в одном месте: `lib/api/index.ts`.

Мок работает в двух местах:

- **на сервере** — поиск и документы (данные из `05-data.md`, только чтение);
- **в браузере** — всё, что меняется: чаты, отметки ответов, текущий тариф, счётчик вопросов, роли демо-пользователей. Всё это хранится в `localStorage`, при чтении проверяется структура, испорченные записи отбрасываются (`mock/valid.ts`).

### Структура

```
frontend/
  next.config.ts                    заголовки безопасности
  src/
    proxy.ts                        CSP с nonce, проверка входа и роли до рендера
    app/
      layout.tsx                    <html lang>, шрифт, словарь
      not-found.tsx
      icon.svg
      (auth)/login/                 вход: page.tsx, login-form.tsx
      (app)/layout.tsx              шапка, проверка сессии
      (app)/error.tsx               ошибка с кнопкой «Попробовать ещё раз»
      (app)/(content)/layout.tsx    обычные страницы с отступами
      (app)/(content)/page.tsx      поиск (главная)
      (app)/(content)/search/       результаты: ?q=&mode=&type=&year=&dept=
      (app)/(content)/docs/[id]/    карточка документа: ?clause=
      (app)/(content)/(admin)/      вкладки и проверка роли admin
        admin/                      сводка
        admin/documents/            документы и загрузка
        admin/analytics/            аналитика
        admin/users/                пользователи
        pricing/                    тарифы и заглушка оплаты
      (app)/chat/layout.tsx         весь чат (ChatApp), чтобы он не размонтировался
      (app)/chat/page.tsx           новый чат: ?doc=<id> задаёт область
      (app)/chat/[id]/page.tsx      диалог
    components/
      ui/        кнопка, поле, сегменты, статус, панель (<dialog>), таблица, пустое состояние, метка демо
      search/    поле поиска, плитки примеров, фильтры, «Продолжить в чате»
      chat/      ChatApp, история, сообщение и панель источника, поле ввода, плитки
      admin/     вкладки, сводка, документы, аналитика, пользователи, тарифы
    lib/
      api/       types.ts, index.ts, mock/ (data, search, chat, billing, admin, valid, browser)
      auth/      parse.ts (cookie, safeNext), session.ts (сервер), actions.ts (вход и выход)
      i18n/      ru.ts, kk.ts, en.ts, makeT, server.ts, client.tsx, actions.ts (смена языка)
      text.ts    подсветка, проверка внешних ссылок, проверка файла
    styles/      globals.css: токены и база
```

### Маршруты и доступ

- Без входа доступен только `/login`. Остальное перенаправляет на вход с `?next=<путь>`. После входа `safeNext` пускает только на путь этого сайта.
- `/admin/*` и `/pricing` доступны только роли `admin`. Проверка идёт дважды: в `proxy.ts` (учитывает и закодированные пути вроде `/%61dmin`) и в layout группы `(admin)`.
- В Next 16 перехват запросов — это `src/proxy.ts`, он работает в рантайме Node.js. Там же для каждого запроса генерируется nonce для Content-Security-Policy.
- **Сессия фазы 1 — мок.** Cookie `izde_session` содержит JSON `{ email, role }`. Она без подписи и читается из JS (`SameSite=Lax`, `Secure` в production, срок 12 часов): мок хранит историю чатов по почте. Пароль не проверяется, роль выбирают на форме. Что меняется в фазе 2 — см. `docs/SECURITY.md`.

### Состояние в адресе

Запрос, режим и фильтры живут в параметрах URL (`/search?q=…&mode=meaning&type=policy`), чтобы результатами можно было поделиться и работала кнопка «назад». Неизвестные значения фильтров и режима игнорируются. Запрос обрезается до 500 символов.

## Типы

```ts
type Lang = 'ru' | 'kk' | 'en';
type Role = 'student' | 'staff' | 'admin';
type SearchMode = 'meaning' | 'keyword';
type DocStatus = 'ready' | 'queued' | 'processing' | 'failed';
type DocType = 'policy' | 'regulation' | 'rules' | 'guide' | 'code';

interface Doc {
  id: string;
  title: string;
  code: string | null;
  lang: Lang;
  org: string;
  sourceUrl: string;       // интерфейс открывает только http(s)
  status: DocStatus;
  sections: string[];
  type: DocType;
  year: number | null;     // в PDF не заполнено
  dept: string | null;     // в PDF не заполнено
}

interface Clause {
  id: string;
  docId: string;
  number: string;          // готовая строка: "п. 15.3"
  section: string;
  text: string;            // дословная цитата
}

interface SearchHit { clause: Clause; doc: Doc; score: number; highlights: string[]; }

interface SearchResult {
  hits: SearchHit[];
  answer: { text: string; citations: Citation[]; lang: Lang } | null;  // только в режиме meaning
}

interface Filters { type?: DocType; year?: string; dept?: string; }    // "none" — поле не заполнено

interface Citation { index: number; clauseId: string; docId: string; }

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;                       // ссылки в тексте — маркеры "[1]"
  citations: Citation[];
  stopped?: boolean;
  feedback?: 'up' | 'down';
  feedbackComment?: string;
  steps?: { text: string; docs: string[] };   // строка шагов над ответом
  suggestions?: string[];
  lang?: Lang;                        // язык ответа; интерфейс помечает русский ответ на KZ/EN
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
  | { type: 'error'; message: string };   // ожидаемые отказы, например дневной лимит

interface SendOptions {
  scope?: Chat['scope'];   // область можно менять между вопросами
  replaceLast?: boolean;   // «Повторить» и правка по ↑: заменить последний вопрос и ответ
}

interface Plan {
  id: 'free' | 'standard' | 'campus';
  name: string;
  docLimit: number;
  questionLimit: number;   // вопросов в чат в день на пользователя
  price: number;           // ₸ в месяц, 0 — бесплатно; интерфейс форматирует и помечает «пример»
}

interface Analytics {
  demo: boolean;           // true — интерфейс ставит метку «Демо-данные»
  queriesWeek: number;
  topQueries: { query: string; count: number }[];
  noResults: { query: string; count: number }[];
  feedback: { up: number; down: number; comments: string[] };
}

interface User { email: string; role: Role; }

const MAX_QUESTION = 2000;                  // символов в вопросе чата
const UPLOAD_DISABLED = 'upload_disabled';  // ошибка uploadDoc в демо
```

## Интерфейс слоя данных

```ts
interface Api {
  login(email: string, password: string, role: Role): Promise<User>;
  logout(): Promise<void>;

  search(q: string, mode: SearchMode, filters?: Filters): Promise<SearchResult>;
  getDoc(id: string): Promise<{ doc: Doc; clauses: Clause[] }>;

  listChats(): Promise<Chat[]>;
  getChat(id: string): Promise<Chat>;
  createChat(scope: Chat['scope'], seed?: ChatMessage[]): Promise<Chat>;
  renameChat(id: string, title: string): Promise<void>;
  deleteChat(id: string): Promise<void>;
  sendMessage(chatId: string, text: string, signal: AbortSignal, options?: SendOptions): AsyncIterable<ChatEvent>;
  setFeedback(chatId: string, messageId: string, value: 'up' | 'down', comment?: string): Promise<void>;

  listDocs(): Promise<Doc[]>;
  uploadDoc(file: File): Promise<Doc>;        // фаза 1: всегда ошибка UPLOAD_DISABLED
  getUsage(): Promise<{ plan: Plan; docCount: number }>;
  listPlans(): Promise<Plan[]>;
  checkout(planId: Plan['id']): Promise<{ ok: boolean }>;   // заглушка

  getAnalytics(): Promise<Analytics>;
  listUsers(): Promise<{ users: User[]; demo: boolean }>;
  setUserRole(email: string, role: Role): Promise<void>;
}
```

- `sendMessage` отдаёт события по мере поступления. В моке это генератор с задержками, в фазе 2 — поток событий с сервера (SSE). `signal` нужен для кнопки «Стоп». Сбой сети — исключение (как у `fetch`), интерфейс показывает «Не получилось ответить» и «Повторить».
- Отметка «Полезно / Не то» — событие для аналитики. Она не пропадает, когда «Повторить» заменяет ответ.
- Ответ на вопрос, которого нет в документах, приходит без `citations`. Интерфейс показывает его как «В документах этого нет».

## Контракт HTTP (фаза 2)

| Метод и путь | Что делает |
|---|---|
| `POST /auth/login`, `POST /auth/logout` | вход и выход, сессия — httpOnly cookie |
| `GET /search?q=&mode=&type=&year=&dept=` | поиск |
| `GET /docs`, `GET /docs/:id` | список и карточка |
| `POST /docs` | загрузка файла (admin) |
| `GET /chats`, `POST /chats`, `GET /chats/:id`, `PATCH /chats/:id`, `DELETE /chats/:id` | диалоги текущего пользователя |
| `POST /chats/:id/messages` | тело `{ text, scope?, replaceLast? }`, ответ — поток событий (SSE) |
| `POST /chats/:id/messages/:mid/feedback` | тело `{ value, comment? }` |
| `GET /billing/plans`, `GET /billing/usage`, `POST /billing/checkout` | тарифы (checkout — admin) |
| `GET /admin/analytics` | статистика запросов (admin) |
| `GET /admin/users`, `PATCH /admin/users/:email` | пользователи и смена роли (admin) |

Роль на каждом запросе к `/admin/*`, `/billing/checkout` и `POST /docs` проверяет сервер, а не интерфейс.

## Языки интерфейса

Три словаря: `ru`, `kk`, `en`. Все строки интерфейса лежат в них. `kk` и `en` типизированы как полный словарь, поэтому пропущенный ключ — ошибка проверки типов. Язык хранится в cookie `lang` и переключается в шапке и на странице входа. Маршруты без языкового префикса. Данные (названия документов, цитаты, ответы мока, номера пунктов) не переводятся.
