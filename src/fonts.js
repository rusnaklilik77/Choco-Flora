// Каталог шрифтов сайта, которые можно выбрать в админке ("Настройки сайта").
// Сами шрифты подключены заранее в index.html (Google Fonts), поэтому здесь
// только список: id (что храним в настройках), человекочитаемое название и
// CSS font-family стек с адекватным запасным вариантом.

export const SITE_FONTS = [
  { id: 'fredoka', label: 'Стандартный (Fredoka + Nunito)', stack: "'Fredoka', 'Nunito', system-ui, sans-serif" },
  { id: 'nunito', label: 'Nunito', stack: "'Nunito', system-ui, sans-serif" },
  { id: 'poppins', label: 'Poppins', stack: "'Poppins', system-ui, sans-serif" },
  { id: 'quicksand', label: 'Quicksand', stack: "'Quicksand', system-ui, sans-serif" },
  { id: 'baloo2', label: 'Baloo 2', stack: "'Baloo 2', system-ui, sans-serif" },
  { id: 'comfortaa', label: 'Comfortaa', stack: "'Comfortaa', system-ui, sans-serif" },
  { id: 'playfair', label: 'Playfair Display', stack: "'Playfair Display', Georgia, serif" },
  { id: 'caveat', label: 'Caveat (рукописный)', stack: "'Caveat', cursive" },
  { id: 'pacifico', label: 'Pacifico (рукописный)', stack: "'Pacifico', cursive" },
  { id: 'dancing', label: 'Dancing Script (рукописный)', stack: "'Dancing Script', cursive" },
]

export const DEFAULT_FONT_ID = 'fredoka'

export function getFontStack(id) {
  return (SITE_FONTS.find((f) => f.id === id) || SITE_FONTS[0]).stack
}
