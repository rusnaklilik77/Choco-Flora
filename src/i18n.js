// Тексты интерфейса сайта на 3 языках. Язык переключается кнопками RU / RO / EN
// в шапке сайта (см. LanguageSwitcher.jsx) и запоминается в браузере посетителя.
//
// ВАЖНО: этого файла раньше не было в проекте, хотя на него ссылались
// App.jsx и LanguageSwitcher.jsx — из-за этого сайт вообще не собирался.
// Файл добавлен, чтобы сайт заработал.

export const LANGUAGES = [
  { code: 'ru', label: 'RU' },
  { code: 'ro', label: 'RO' },
  { code: 'en', label: 'EN' },
]

export const DEFAULT_LANG = 'ru'

const TRANSLATIONS = {
  ru: {
    subtitle: 'Десерты, приготовленные с душой',
    adminBadge: '👑 Админ',
    menuHeading: 'Меню',
    emptyMenu: 'Меню пока пустое — скоро здесь появятся вкусности!',
    compositionLabel: 'Из чего состоит',
    callButtonPrefix: 'Заказать по телефону',
    enterSite: 'Войти',
    categoryNavLabel: 'Группы меню',
    searchPlaceholder: 'Поиск по названию',
    filtersButton: 'Фильтры',
    filtersTitle: 'Выберите фильтры',
    filtersHint: 'Можно выбрать один или несколько. Покажутся товары, у которых есть все выбранные.',
    filtersManage: 'Управлять',
    filtersClear: 'Сбросить',
    filtersShow: 'Показать ({n})',
    filtersNone: 'Фильтров пока нет.',
    noResults: 'Ничего не найдено. Попробуйте изменить поиск или фильтры.',
    clearSearch: 'Очистить поиск',
  },
  ro: {
    subtitle: 'Deserturi făcute cu suflet',
    adminBadge: '👑 Admin',
    menuHeading: 'Meniu',
    emptyMenu: 'Meniul este încă gol — în curând vor apărea bunătăți!',
    compositionLabel: 'Compoziție',
    callButtonPrefix: 'Comandă la telefon',
    enterSite: 'Intră',
    categoryNavLabel: 'Grupele meniului',
    searchPlaceholder: 'Caută după nume',
    filtersButton: 'Filtre',
    filtersTitle: 'Alege filtrele',
    filtersHint: 'Poți alege unul sau mai multe. Se vor afișa produsele care le au pe toate cele alese.',
    filtersManage: 'Gestionează',
    filtersClear: 'Șterge',
    filtersShow: 'Arată ({n})',
    filtersNone: 'Încă nu există filtre.',
    noResults: 'Nu s-a găsit nimic. Încearcă să schimbi căutarea sau filtrele.',
    clearSearch: 'Șterge căutarea',
  },
  en: {
    subtitle: 'Desserts made with heart',
    adminBadge: '👑 Admin',
    menuHeading: 'Menu',
    emptyMenu: 'The menu is empty for now — tasty things are coming soon!',
    compositionLabel: 'What’s inside',
    callButtonPrefix: 'Order by phone',
    enterSite: 'Enter',
    categoryNavLabel: 'Menu groups',
    searchPlaceholder: 'Search by name',
    filtersButton: 'Filters',
    filtersTitle: 'Choose filters',
    filtersHint: 'You can pick one or more. Items that have all the chosen ones will be shown.',
    filtersManage: 'Manage',
    filtersClear: 'Clear',
    filtersShow: 'Show ({n})',
    filtersNone: 'No filters yet.',
    noResults: 'Nothing found. Try changing the search or filters.',
    clearSearch: 'Clear search',
  },
}

export function getTranslations(lang) {
  return TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANG]
}

export function fmt(str, vars) {
  return (str || '').replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] !== undefined ? vars[k] : `{${k}}`))
}
