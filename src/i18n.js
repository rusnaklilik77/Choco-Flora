// Тексты сайта на трёх языках. Меняются кнопкой-переключателем в шапке
// сайта и сохраняются в этом браузере (localStorage), чтобы при
// следующем визите открывался тот же язык.
//
// Название блюд, цены и состав — это данные, которые владелец вводит
// сам в админке, поэтому автоматически не переводятся. Здесь переводятся
// только подписи и надписи самого интерфейса.

export const LANGUAGES = [
  { code: 'ru', label: 'RU' },
  { code: 'ro', label: 'RO' },
  { code: 'en', label: 'EN' },
]

export const TRANSLATIONS = {
  ru: {
    subtitle: 'десерты с душой',
    menuHeading: 'Меню',
    emptyMenu: 'Меню пока пустое. Загляните позже — мы уже готовим что-то вкусное 🍫',
    compositionLabel: 'Состав',
    callButtonPrefix: '📞 Позвонить',
    adminBadge: '🔓 режим админа — нажмите, чтобы открыть панель',
  },
  ro: {
    subtitle: 'deserturi făcute cu suflet',
    menuHeading: 'Meniu',
    emptyMenu: 'Meniul este momentan gol. Reveniți mai târziu — pregătim ceva delicios 🍫',
    compositionLabel: 'Compoziție',
    callButtonPrefix: '📞 Sunați',
    adminBadge: '🔓 mod administrator — apăsați pentru a deschide panoul',
  },
  en: {
    subtitle: 'desserts made with heart',
    menuHeading: 'Menu',
    emptyMenu: "The menu is empty right now. Check back soon — we're cooking up something delicious 🍫",
    compositionLabel: 'Ingredients',
    callButtonPrefix: '📞 Call',
    adminBadge: '🔓 admin mode — click to open the panel',
  },
}

export const DEFAULT_LANG = 'ru'

export function getTranslations(lang) {
  return TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANG]
}
