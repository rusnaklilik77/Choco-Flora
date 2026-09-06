const MENU_KEY = 'choco-flora-menu'
const THEME_KEY = 'choco-flora-theme'
const CUSTOM_THEMES_KEY = 'choco-flora-custom-themes'
const LANG_KEY = 'choco-flora-lang'

export function loadMenu(fallback) {
  try {
    const raw = localStorage.getItem(MENU_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : fallback
  } catch {
    return fallback
  }
}

export function saveMenu(menu) {
  try {
    localStorage.setItem(MENU_KEY, JSON.stringify(menu))
  } catch (err) {
    // Раньше ошибка (например, переполнение хранилища) тихо игнорировалась,
    // из-за чего казалось, что данные сохранились, хотя на самом деле нет.
    // Теперь пробрасываем её дальше, чтобы админка показала понятную ошибку.
    console.error('[choco-flora] Не удалось сохранить меню в localStorage:', err)
    throw err
  }
}

export function loadThemeId(fallback) {
  try {
    return localStorage.getItem(THEME_KEY) || fallback
  } catch {
    return fallback
  }
}

export function saveThemeId(id) {
  try {
    localStorage.setItem(THEME_KEY, id)
  } catch {
    /* ignore */
  }
}

export function loadCustomThemes() {
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCustomThemes(themes) {
  try {
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(themes))
  } catch (err) {
    // Раньше ошибка тихо игнорировалась — тема выглядела «сохранённой» в
    // интерфейсе, а на самом деле не сохранялась. Теперь пробрасываем
    // ошибку дальше, чтобы админка показала понятное сообщение.
    console.error('[choco-flora] Не удалось сохранить темы в localStorage:', err)
    throw err
  }
}

// Язык интерфейса сайта — личная настройка браузера каждого посетителя
// (не общая для всех, в отличие от темы оформления).
export function loadLang(fallback) {
  try {
    return localStorage.getItem(LANG_KEY) || fallback
  } catch {
    return fallback
  }
}

export function saveLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    /* ignore */
  }
}
