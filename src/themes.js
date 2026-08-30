// Каталог тем оформления сайта Choco-Flora
// colors    — палитра темы
// particles — эмодзи, которые падают/парят на фоне
// pattern   — название орнамента для декоративной SVG-текстуры (ThemeBackdrop)
// mascotItems — набор анимированных фигурок-талисманов темы (1 или несколько)

export const THEME_CATEGORIES = [
  { id: 'base', label: 'Базовая' },
  { id: 'season', label: 'Времена года' },
  { id: 'holiday', label: 'Праздники' },
  { id: 'exclusive', label: 'Эксклюзив' },
  { id: 'custom', label: 'Мои темы' },
]

export const THEMES = [
  {
    id: 'default',
    category: 'base',
    name: 'Choco-Flora',
    emoji: '🍫',
    colors: {
      bgFrom: '#2b0f1a',
      bgTo: '#1a0a12',
      accent: '#ff2e87',
      accent2: '#ffb6d9',
      card: '#fff5f9',
      text: '#3a1220',
    },
    particles: ['🌸', '✨', '🍬'],
    pattern: 'bloom',
    mascotItems: [{ emoji: '🍫', size: 1 }],
  },
  // ---- Времена года ----
  {
    id: 'autumn',
    category: 'season',
    name: 'Осень',
    emoji: '🍁',
    colors: {
      bgFrom: '#4a2a12',
      bgTo: '#7a3b12',
      accent: '#e8722c',
      accent2: '#ffcf8a',
      card: '#fff3e6',
      text: '#3a2410',
    },
    particles: ['🍂', '🍁', '🌰'],
    pattern: 'leaf',
    mascotItems: [{ emoji: '🦔', size: 1 }],
  },
  {
    id: 'winter',
    category: 'season',
    name: 'Зима',
    emoji: '❄️',
    colors: {
      bgFrom: '#0d2b45',
      bgTo: '#1a4a6e',
      accent: '#5ec8ff',
      accent2: '#eaf7ff',
      card: '#f3fbff',
      text: '#0d2b45',
    },
    particles: ['❄️', '✨'],
    pattern: 'snowflake',
    mascotItems: [{ emoji: '⛄', size: 1 }],
  },
  {
    id: 'spring',
    category: 'season',
    name: 'Весна',
    emoji: '🌷',
    colors: {
      bgFrom: '#274a2e',
      bgTo: '#3f7a4a',
      accent: '#ff8fb3',
      accent2: '#c8f2b0',
      card: '#f6fff2',
      text: '#204225',
    },
    particles: ['🌸', '🌷', '🦋'],
    pattern: 'bloom',
    mascotItems: [{ emoji: '🐣', size: 1 }],
  },
  {
    id: 'summer',
    category: 'season',
    name: 'Лето',
    emoji: '☀️',
    colors: {
      bgFrom: '#0b4a4a',
      bgTo: '#0f8c8c',
      accent: '#ffd23f',
      accent2: '#7fe8e8',
      card: '#fffdf0',
      text: '#0b3a3a',
    },
    particles: ['☀️', '🍉', '🌴'],
    pattern: 'wave',
    mascotItems: [{ emoji: '🦩', size: 1 }],
  },
  // ---- Праздники ----
  {
    id: 'halloween',
    category: 'holiday',
    name: 'Хэллоуин',
    emoji: '🎃',
    colors: {
      bgFrom: '#1a0e2b',
      bgTo: '#3a1454',
      accent: '#ff7a1a',
      accent2: '#b06bff',
      card: '#fff1e0',
      text: '#241033',
    },
    particles: ['🦇', '🎃', '🕸️'],
    pattern: 'bat',
    mascotItems: [{ emoji: '🧙‍♀️', size: 1 }],
  },
  {
    id: 'newyear',
    category: 'holiday',
    name: 'Новый год',
    emoji: '🎄',
    colors: {
      bgFrom: '#0d2b1a',
      bgTo: '#7a1020',
      accent: '#ffcf5c',
      accent2: '#6bffb0',
      card: '#fff8ec',
      text: '#0d2b1a',
    },
    particles: ['❄️', '🎉', '⭐', '🍬'],
    pattern: 'star',
    // Целая новогодняя сценка вместо одной фигурки:
    mascotItems: [
      { emoji: '🎄', size: 1.15, offset: 0 },
      { emoji: '🎅', size: 1, offset: 1 },
      { emoji: '🎁', size: 0.72, offset: 2 },
      { emoji: '🍬', size: 0.55, offset: 3 },
    ],
  },
  {
    id: 'valentine',
    category: 'holiday',
    name: '14 февраля',
    emoji: '💘',
    colors: {
      bgFrom: '#4a0d24',
      bgTo: '#8c1046',
      accent: '#ff4d78',
      accent2: '#ffc2d6',
      card: '#fff0f4',
      text: '#4a0d24',
    },
    particles: ['💕', '💘', '🌹'],
    pattern: 'heart',
    mascotItems: [{ emoji: '🧸', size: 1 }],
  },
  {
    id: 'march8',
    category: 'holiday',
    name: '8 Марта',
    emoji: '🌷',
    colors: {
      bgFrom: '#3a0d3a',
      bgTo: '#8c2a6e',
      accent: '#ff8fd6',
      accent2: '#ffe27a',
      card: '#fff3fb',
      text: '#3a0d3a',
    },
    particles: ['🌷', '🌸', '💐'],
    pattern: 'bloom',
    mascotItems: [{ emoji: '💐', size: 1 }],
  },
  {
    id: 'easter',
    category: 'holiday',
    name: 'Пасха',
    emoji: '🐰',
    colors: {
      bgFrom: '#3a3a1a',
      bgTo: '#7a7a3a',
      accent: '#ffd25c',
      accent2: '#c9a7ff',
      card: '#fffef2',
      text: '#3a3a1a',
    },
    particles: ['🥚', '🌼', '🐣'],
    pattern: 'egg',
    mascotItems: [{ emoji: '🐰', size: 1 }],
  },
  {
    id: 'sea',
    category: 'holiday',
    name: 'Море и пляж',
    emoji: '🏖️',
    colors: {
      bgFrom: '#053a4a',
      bgTo: '#0d7a8c',
      accent: '#ffd23f',
      accent2: '#8fe8ff',
      card: '#f2fdff',
      text: '#053a4a',
    },
    particles: ['🌊', '🐚', '🐬'],
    pattern: 'wave',
    mascotItems: [{ emoji: '🦀', size: 1 }],
  },
  // ---- Эксклюзив ----
  {
    id: 'football',
    category: 'exclusive',
    name: 'Футбол',
    emoji: '⚽',
    colors: {
      bgFrom: '#0d2b12',
      bgTo: '#1a5c2a',
      accent: '#ffffff',
      accent2: '#ffd23f',
      card: '#f2fff4',
      text: '#0d2b12',
    },
    particles: ['⚽', '🏆', '🥅'],
    pattern: 'pitch',
    mascotItems: [{ emoji: '⚽', size: 1 }],
  },
  {
    id: 'antihero',
    category: 'exclusive',
    name: 'Красный мститель',
    emoji: '🗡️',
    colors: {
      bgFrom: '#1a0d0d',
      bgTo: '#5c0d0d',
      accent: '#ff1a1a',
      accent2: '#2b2b2b',
      card: '#fff2f2',
      text: '#1a0d0d',
    },
    particles: ['💥', '⭐'],
    pattern: 'shatter',
    mascotItems: [{ emoji: '🥷', size: 1 }],
  },
  {
    id: 'webhero',
    category: 'exclusive',
    name: 'Паутинный герой',
    emoji: '🕸️',
    colors: {
      bgFrom: '#0d1a5c',
      bgTo: '#5c0d0d',
      accent: '#ff2b2b',
      accent2: '#2b4dff',
      card: '#f2f4ff',
      text: '#0d1a5c',
    },
    // Оригинальная тема "своего героя-паука": силуэт и паутина,
    // без использования образов конкретных персонажей.
    particles: ['🕸️', '⭐'],
    pattern: 'web',
    mascotItems: [{ emoji: '🕷️', size: 1 }],
  },
]

export const getTheme = (id) => THEMES.find((t) => t.id === id) || THEMES[0]

// Ищет тему по id в объединённом списке (встроенные + кастомные из Firebase
// / localStorage). Если не найдено — отдаёт тему по умолчанию.
export const getThemeFromList = (list, id) => {
  const all = list && list.length ? list : THEMES
  return all.find((t) => t.id === id) || all[0] || THEMES[0]
}

// Готовые "пустые" настройки для новой кастомной темы в админке.
export const emptyCustomTheme = () => ({
  id: null,
  custom: true,
  category: 'custom',
  name: '',
  emoji: '🎨',
  colors: {
    bgFrom: '#241220',
    bgTo: '#120a10',
    accent: '#ff2e87',
    accent2: '#ffb6d9',
    card: '#fff5f9',
    text: '#3a1220',
  },
  bgImage: null,
  particleImages: [],
  pattern: null,
  // Фигурка-талисман в правом нижнем углу (с покачивающейся анимацией) —
  // по умолчанию тот же эмодзи, что и у темы, чтобы новая тема сразу
  // выглядела "живой", даже если админ не станет ничего донастраивать.
  mascotItems: [{ emoji: '🎨', size: 1 }],
})
