// Небольшие хелперы для работы с HEX-цветом без внешних библиотек.
// Нужны, чтобы админ мог выбрать всего один "цвет темы", а остальная
// палитра (фон, светлый акцент, карточки, текст) подбиралась сама.

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean
  const num = parseInt(full, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function rgbToHex({ r, g, b }) {
  const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Смешивает цвет с белым (amount 0..1 — доля белого). */
export function lighten(hex, amount) {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex({
    r: r + (255 - r) * amount,
    g: g + (255 - g) * amount,
    b: b + (255 - b) * amount,
  })
}

/** Смешивает цвет с чёрным (amount 0..1 — доля чёрного). */
export function darken(hex, amount) {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex({
    r: r * (1 - amount),
    g: g * (1 - amount),
    b: b * (1 - amount),
  })
}

/**
 * По одному выбранному акцентному цвету собирает полную палитру темы —
 * так же, как это сделано вручную во встроенных темах.
 */
export function deriveThemeColors(accentHex) {
  const accent = accentHex || '#ff2e87'
  return {
    accent,
    accent2: lighten(accent, 0.55),
    bgFrom: darken(accent, 0.55),
    bgTo: darken(accent, 0.75),
    card: lighten(accent, 0.94),
    text: darken(accent, 0.62),
  }
}
