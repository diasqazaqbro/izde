export const ru = {
  "meta.description": "Поиск по документам университета",

  "header.home": "Izde, на главную",
  "header.org": "IITU",
  "nav.label": "Разделы",
  "nav.search": "Поиск",
  "lang.label": "Язык интерфейса",
  "lang.ru": "RU",
  "lang.kk": "KZ",
  "lang.en": "EN",
  "profile.open": "Профиль",
  "profile.logout": "Выйти",

  "role.student": "Студент",
  "role.staff": "Сотрудник",
  "role.admin": "Администратор",

  "login.title": "Вход",
  "login.lead": "Поиск по документам университета",
  "login.email": "Почта",
  "login.password": "Пароль",
  "login.role": "Войти как",
  "login.submit": "Войти",
  "login.hint": "Демо-вход: подойдут любые почта и пароль.",
  "login.error": "Введите почту и пароль.",

  "search.label": "Поисковый запрос",
  "search.placeholder": "Спросите своими словами",
  "search.submit": "Найти",
  "search.modes": "Режим поиска",
  "search.mode.meaning": "По смыслу",
  "search.mode.keyword": "По словам",

  "home.lead": "Спросите своими словами. Izde найдёт нужный пункт в документах университета.",
  "home.try": "Попробуйте",
  "home.stat": "Документов IITU в базе: {total}, готовы к поиску: {ready}",
  "example.1": "можно ли пересдать экзамен",
  "example.2": "сколько можно пропускать пары",
  "example.3": "выход из академического отпуска",
  "example.4": "сколько кредитов стажировка докторанта",

  "results.title": "Результаты поиска",
  "results.answer": "Ответ по документам",
  "results.source": "Источник: {doc}, {clause}",
  "results.count": "Найдено фрагментов: {n}",
  "results.empty.title": "Ничего не нашлось",
  "results.empty.keyword":
    "В режиме «По словам» Izde ищет точные слова из запроса, а эти документы написаны на английском. Переключитесь на «По смыслу».",
  "results.empty.meaning": "Попробуйте спросить иначе или выберите пример.",

  "doc.back": "Назад",
  "doc.lang": "язык: {lang}",
  "doc.source": "Открыть PDF на iitu.edu.kz",
  "doc.found": "Найденные пункты",
  "doc.active": "Из поиска",
  "doc.toc": "Оглавление",
  "doc.note":
    "Карточка показывает оглавление и пункты, которые участвуют в поиске. Полный текст документа появится в рабочей версии.",

  "demo.note":
    "Демо-версия: поиск и ответы имитируются, но названия документов и цитаты взяты из открытых PDF на iitu.edu.kz.",

  "notFound.title": "Страница не найдена",
  "notFound.text": "Ссылка устарела или в ней ошибка.",
  "notFound.action": "На главную",
};

export type Dict = typeof ru;
export type Key = keyof Dict;
