// Небольшие орнаменты для фона тем. Каждая функция возвращает содержимое
// <svg> тайла 64x64, который будет замощён по всему фону (см. ThemeBackdrop).
// Свой, оригинальный орнамент под каждую тему — без использования чужой графики.

const TILE = 64

function svgWrap(inner, color, opacity = 0.5) {
  const body = `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">${inner}</svg>`
    .replace(/CURRENT/g, color)
    .replace(/OPACITY/g, opacity)
  return `url("data:image/svg+xml,${encodeURIComponent(body)}")`
}

const SHAPES = {
  bloom: () => `
    <g fill="none" stroke="CURRENT" stroke-width="1.4" opacity="OPACITY">
      <circle cx="16" cy="16" r="5"/><circle cx="8" cy="16" r="5"/><circle cx="24" cy="16" r="5"/>
      <circle cx="16" cy="8" r="5"/><circle cx="16" cy="24" r="5"/>
      <circle cx="48" cy="48" r="5"/><circle cx="40" cy="48" r="5"/><circle cx="56" cy="48" r="5"/>
      <circle cx="48" cy="40" r="5"/><circle cx="48" cy="56" r="5"/>
    </g>`,
  leaf: () => `
    <g fill="none" stroke="CURRENT" stroke-width="1.4" opacity="OPACITY">
      <path d="M12 44 C12 24, 32 12, 44 12 C44 32, 32 44, 12 44 Z"/>
      <path d="M12 44 L44 12"/>
    </g>`,
  snowflake: () => `
    <g stroke="CURRENT" stroke-width="1.4" opacity="OPACITY">
      <g transform="translate(32,32)">
        <line x1="0" y1="-16" x2="0" y2="16"/>
        <line x1="-16" y1="0" x2="16" y2="0"/>
        <line x1="-11" y1="-11" x2="11" y2="11"/>
        <line x1="-11" y1="11" x2="11" y2="-11"/>
        <line x1="0" y1="-16" x2="-4" y2="-11"/><line x1="0" y1="-16" x2="4" y2="-11"/>
        <line x1="0" y1="16" x2="-4" y2="11"/><line x1="0" y1="16" x2="4" y2="11"/>
      </g>
    </g>`,
  wave: () => `
    <g fill="none" stroke="CURRENT" stroke-width="1.6" opacity="OPACITY">
      <path d="M0 20 Q 16 8, 32 20 T 64 20"/>
      <path d="M0 40 Q 16 28, 32 40 T 64 40"/>
    </g>`,
  bat: () => `
    <g fill="CURRENT" opacity="OPACITY">
      <path d="M32 26c-4-8-14-10-18-4 4-1 7 0 9 3-6 0-11 3-13 8 5-2 9-2 12 0-3 3-3 7-1 10 2-4 6-6 11-6s9 2 11 6c2-3 2-7-1-10 3-2 7-2 12 0-2-5-7-8-13-8 2-3 5-4 9-3-4-6-14-4-18 4z"/>
    </g>`,
  star: () => `
    <g fill="CURRENT" opacity="OPACITY">
      <path d="M16 6 l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z"/>
      <path d="M48 38 l2.4 5.6 5.6 0.8-4 4 0.9 5.6-4.9-3.2-4.9 3.2 0.9-5.6-4-4 5.6-0.8z"/>
    </g>`,
  heart: () => `
    <g fill="none" stroke="CURRENT" stroke-width="1.6" opacity="OPACITY">
      <path d="M32 46 C14 34, 14 18, 26 16 C30 15, 32 19, 32 22 C32 19, 34 15, 38 16 C50 18, 50 34, 32 46 Z"/>
    </g>`,
  egg: () => `
    <g fill="none" stroke="CURRENT" stroke-width="1.6" opacity="OPACITY">
      <path d="M32 10 C42 10, 48 26, 48 36 C48 47, 41 54, 32 54 C23 54, 16 47, 16 36 C16 26, 22 10, 32 10 Z"/>
    </g>`,
  pitch: () => `
    <g fill="none" stroke="CURRENT" stroke-width="1.4" opacity="OPACITY">
      <circle cx="32" cy="32" r="10"/>
      <line x1="0" y1="32" x2="64" y2="32"/>
    </g>`,
  shatter: () => `
    <g fill="none" stroke="CURRENT" stroke-width="1.6" opacity="OPACITY">
      <path d="M4 4 L24 20 L14 26 L34 40 L26 46 L48 60"/>
      <path d="M60 6 L44 22 L54 28 L34 44"/>
    </g>`,
  web: () => `
    <g fill="none" stroke="CURRENT" stroke-width="1.1" opacity="OPACITY">
      <circle cx="32" cy="32" r="8"/>
      <circle cx="32" cy="32" r="16"/>
      <circle cx="32" cy="32" r="24"/>
      <line x1="32" y1="0" x2="32" y2="64"/>
      <line x1="0" y1="32" x2="64" y2="32"/>
      <line x1="9" y1="9" x2="55" y2="55"/>
      <line x1="9" y1="55" x2="55" y2="9"/>
    </g>`,
}

export function getPatternBackground(patternKey, color, opacity = 0.5) {
  const builder = SHAPES[patternKey] || SHAPES.bloom
  return svgWrap(builder(), color, opacity)
}
