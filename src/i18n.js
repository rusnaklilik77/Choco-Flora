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
    categoryNavLabel: 'Категории меню',
    categories: {
      all: 'Меню',
      packaging: 'Упаковки',
      alco: 'Алко',
      choco: 'Шоколад',
      fruits: 'Фрукты',
    },
  },
  ro: {
    subtitle: 'Deserturi făcute cu suflet',
    adminBadge: '👑 Admin',
    menuHeading: 'Meniu',
    emptyMenu: 'Meniul este încă gol — în curând vor apărea bunătăți!',
    compositionLabel: 'Compoziție',
    callButtonPrefix: 'Comandă la telefon',
    enterSite: 'Intră',
    categoryNavLabel: 'Categoriile meniului',
    categories: {
      all: 'Meniu',
      packaging: 'Ambalaje',
      alco: 'Alcool',
      choco: 'Ciocolată',
      fruits: 'Fructe',
    },
  },
  en: {
    subtitle: 'Desserts made with heart',
    adminBadge: '👑 Admin',
    menuHeading: 'Menu',
    emptyMenu: 'The menu is empty for now — tasty things are coming soon!',
    compositionLabel: 'What’s inside',
    callButtonPrefix: 'Order by phone',
    enterSite: 'Enter',
    categoryNavLabel: 'Menu categories',
    categories: {
      all: 'Menu',
      packaging: 'Packs',
      alco: 'Alcohol',
      choco: 'Choco',
      fruits: 'Fruits',
    },
  },
}

export function getTranslations(lang) {
  return TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANG]
}
