// Единая точка доступа к данным сайта: меню (название, цена, описание,
// ссылки на фото), темы оформления (в том числе встроенные — теперь они
// тоже обычные редактируемые записи, а не «зашитый» в код список),
// активная тема сайта, логин админа.
//
// Если в src/firebase.js прописаны реальные ключи Firebase — всё хранится
// в Firestore и синхронизируется у всех посетителей в реальном времени.
// Если ключи ещё не прописаны — используется localStorage в этом браузере,
// чтобы сайт можно было полноценно тестировать без Firebase.
//
// Фото (фон темы, падающие стикеры, фото товаров) хранятся не как сами
// картинки, а как ССЫЛКИ (например, на Google Диск) — поэтому документы
// Firestore остаются крошечными и бесплатного плана Spark хватает с
// огромным запасом.

import { db, isFirebaseConfigured } from '../firebase'
import { DEFAULT_MENU } from '../data/menuData'
import { THEMES as SEED_THEMES } from '../themes'
import {
  loadMenu, saveMenu,
  loadThemeId, saveThemeId,
  loadCustomThemes, saveCustomThemes,
  loadSiteSettings, saveSiteSettings,
} from '../utils/storage'

const DEFAULT_ADMIN = { login: 'admin', password: 'admin' }

// Настройки сайта, которые можно менять в режиме админа: название сайта,
// ссылка на лого и цвета текста (заголовка и общего текста). Пустая строка
// у цвета означает «использовать цвет текущей темы».
const DEFAULT_SITE_SETTINGS = {
  siteName: 'Choco-Flora',
  logoUrl: '',
  titleColor: '',
  textColor: '',
}

// ---------------------------------------------------------------------
// РЕЖИМ FIREBASE
// ---------------------------------------------------------------------
async function firestoreApi() {
  const {
    collection, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc,
    getDoc, getDocs, serverTimestamp,
  } = await import('firebase/firestore')

  const menuCol = collection(db, 'menu')
  const themesCol = collection(db, 'themes')
  const siteDoc = doc(db, 'settings', 'site')
  const adminDoc = doc(db, 'settings', 'admin')

  async function ensureSeed() {
    const menuSnap = await getDocs(menuCol)
    if (menuSnap.empty) {
      await Promise.all(
        DEFAULT_MENU.map((item) => {
          const { id, ...rest } = item
          return setDoc(doc(db, 'menu', id), rest)
        })
      )
    }

    // Встроенные темы кладём в базу один раз при первом запуске — дальше
    // это обычные документы, которые можно редактировать и удалять точно
    // так же, как темы, созданные вручную в админке.
    const themesSnap = await getDocs(themesCol)
    if (themesSnap.empty) {
      await Promise.all(
        SEED_THEMES.map((theme) => {
          const { id, ...rest } = theme
          return setDoc(doc(db, 'themes', id), {
            ...rest,
            bgImage: rest.bgImage || null,
            particleImages: rest.particleImages || [],
          })
        })
      )
    }

    const siteSnap = await getDoc(siteDoc)
    if (!siteSnap.exists()) {
      await setDoc(siteDoc, { themeId: 'default', ...DEFAULT_SITE_SETTINGS })
    }
    const adminSnap = await getDoc(adminDoc)
    if (!adminSnap.exists()) {
      await setDoc(adminDoc, DEFAULT_ADMIN)
    }
  }

  return {
    mode: 'firebase',

    async init() {
      await ensureSeed()
    },

    subscribeMenu(callback) {
      return onSnapshot(menuCol, (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      })
    },

    subscribeSiteTheme(callback) {
      return onSnapshot(siteDoc, (snap) => {
        callback(snap.exists() ? snap.data().themeId || 'default' : 'default')
      })
    },

    subscribeThemes(callback) {
      return onSnapshot(themesCol, (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      })
    },

    async setSiteTheme(themeId) {
      await setDoc(siteDoc, { themeId, updatedAt: serverTimestamp() }, { merge: true })
    },

    subscribeSiteSettings(callback) {
      return onSnapshot(siteDoc, (snap) => {
        const data = snap.exists() ? snap.data() : {}
        callback({ ...DEFAULT_SITE_SETTINGS, ...data })
      })
    },

    async setSiteSettings(settings) {
      await setDoc(siteDoc, { ...settings, updatedAt: serverTimestamp() }, { merge: true })
    },

    async addMenuItem(item) {
      await addDoc(menuCol, item)
    },

    async updateMenuItem(id, item) {
      await updateDoc(doc(db, 'menu', id), item)
    },

    async deleteMenuItem(id) {
      await deleteDoc(doc(db, 'menu', id))
    },

    async addTheme(theme) {
      const { id, ...rest } = theme
      const ref = await addDoc(themesCol, rest)
      return ref.id
    },

    async updateTheme(id, theme) {
      const { id: _drop, ...rest } = theme
      await updateDoc(doc(db, 'themes', id), rest)
    },

    async deleteTheme(id) {
      await deleteDoc(doc(db, 'themes', id))
      // Если удаляемая тема была активной на сайте — переключаемся на
      // любую из оставшихся (если тем совсем не осталось — на 'default',
      // приложение в этом случае покажет базовое оформление по умолчанию).
      const siteSnap = await getDoc(siteDoc)
      if (siteSnap.exists() && siteSnap.data().themeId === id) {
        const remaining = await getDocs(themesCol)
        const fallbackId = remaining.docs[0]?.id || 'default'
        await setDoc(siteDoc, { themeId: fallbackId }, { merge: true })
      }
    },

    async verifyAdminLogin(login, password) {
      const snap = await getDoc(adminDoc)
      const data = snap.exists() ? snap.data() : DEFAULT_ADMIN
      return login === data.login && password === data.password
    },
  }
}

// ---------------------------------------------------------------------
// ЛОКАЛЬНЫЙ РЕЖИМ (localStorage) — работает без Firebase «из коробки»
// ---------------------------------------------------------------------
function seedLocalThemesIfNeeded() {
  const existing = loadCustomThemes()
  if (existing && existing.length) return existing
  const seeded = SEED_THEMES.map((t) => ({ ...t }))
  saveCustomThemes(seeded)
  return seeded
}

function localApi() {
  const listeners = { menu: new Set(), theme: new Set(), themes: new Set(), siteSettings: new Set() }

  // синхронизация между вкладками одного браузера
  window.addEventListener('storage', (e) => {
    if (e.key === 'choco-flora-menu') {
      const menu = loadMenu(DEFAULT_MENU)
      listeners.menu.forEach((cb) => cb(menu))
    }
    if (e.key === 'choco-flora-theme') {
      listeners.theme.forEach((cb) => cb(loadThemeId('default')))
    }
    if (e.key === 'choco-flora-custom-themes') {
      listeners.themes.forEach((cb) => cb(loadCustomThemes()))
    }
    if (e.key === 'choco-flora-site-settings') {
      listeners.siteSettings.forEach((cb) => cb(loadSiteSettings(DEFAULT_SITE_SETTINGS)))
    }
  })

  return {
    mode: 'local',

    async init() {
      seedLocalThemesIfNeeded()
    },

    subscribeMenu(callback) {
      const menu = loadMenu(DEFAULT_MENU)
      callback(menu)
      listeners.menu.add(callback)
      return () => listeners.menu.delete(callback)
    },

    subscribeSiteTheme(callback) {
      callback(loadThemeId('default'))
      listeners.theme.add(callback)
      return () => listeners.theme.delete(callback)
    },

    subscribeThemes(callback) {
      callback(seedLocalThemesIfNeeded())
      listeners.themes.add(callback)
      return () => listeners.themes.delete(callback)
    },

    async setSiteTheme(themeId) {
      saveThemeId(themeId)
      listeners.theme.forEach((cb) => cb(themeId))
    },

    subscribeSiteSettings(callback) {
      callback(loadSiteSettings(DEFAULT_SITE_SETTINGS))
      listeners.siteSettings.add(callback)
      return () => listeners.siteSettings.delete(callback)
    },

    async setSiteSettings(settings) {
      const current = loadSiteSettings(DEFAULT_SITE_SETTINGS)
      const next = { ...current, ...settings }
      saveSiteSettings(next)
      listeners.siteSettings.forEach((cb) => cb(next))
    },

    async addMenuItem(item) {
      const menu = loadMenu(DEFAULT_MENU)
      const next = [...menu, { id: `item-${Date.now()}`, ...item }]
      saveMenu(next)
      listeners.menu.forEach((cb) => cb(next))
    },

    async updateMenuItem(id, item) {
      const menu = loadMenu(DEFAULT_MENU)
      const next = menu.map((it) => (it.id === id ? { ...it, ...item, id } : it))
      saveMenu(next)
      listeners.menu.forEach((cb) => cb(next))
    },

    async deleteMenuItem(id) {
      const menu = loadMenu(DEFAULT_MENU)
      const next = menu.filter((it) => it.id !== id)
      saveMenu(next)
      listeners.menu.forEach((cb) => cb(next))
    },

    async addTheme(theme) {
      const themes = seedLocalThemesIfNeeded()
      const newId = `theme-${Date.now()}`
      const { id: _drop, ...rest } = theme
      const next = [...themes, { ...rest, id: newId }]
      saveCustomThemes(next)
      listeners.themes.forEach((cb) => cb(next))
      return newId
    },

    async updateTheme(id, theme) {
      const themes = seedLocalThemesIfNeeded()
      const { id: _drop, ...rest } = theme
      const next = themes.map((t) => (t.id === id ? { ...t, ...rest, id } : t))
      saveCustomThemes(next)
      listeners.themes.forEach((cb) => cb(next))
    },

    async deleteTheme(id) {
      const themes = seedLocalThemesIfNeeded()
      const next = themes.filter((t) => t.id !== id)
      saveCustomThemes(next)
      listeners.themes.forEach((cb) => cb(next))

      if (loadThemeId('default') === id) {
        const fallbackId = next[0]?.id || 'default'
        saveThemeId(fallbackId)
        listeners.theme.forEach((cb) => cb(fallbackId))
      }
    },

    async verifyAdminLogin(login, password) {
      return login === DEFAULT_ADMIN.login && password === DEFAULT_ADMIN.password
    },
  }
}

// ---------------------------------------------------------------------
// ВЫБОР РЕЖИМА (с автоматической подстраховкой)
// ---------------------------------------------------------------------
// Если в src/firebase.js прописаны ключи, пробуем работать через Firebase.
// НО: если что-то не так с настройкой (не тот projectId, не применены
// правила доступа Firestore, нет интернета и т.п.), init() выбросит
// ошибку — и тогда мы НЕ оставляем приложение в «полуживом» состоянии
// (когда админка вроде открывается, а сохранить ничего нельзя), а сами
// переключаемся в локальный режим (localStorage), чтобы сайт и админка
// гарантированно продолжали работать и всё введённое реально сохранялось.
async function resolveApi() {
  if (!isFirebaseConfigured) {
    const api = localApi()
    await api.init()
    return api
  }
  try {
    const api = await firestoreApi()
    await api.init()
    return api
  } catch (err) {
    console.error(
      '[choco-flora] Firebase недоступен (проверьте ключи в .env и правила доступа Firestore — firestore.rules). ' +
        'Переключаюсь на локальный режим (localStorage), чтобы сохранение продолжало работать:',
      err
    )
    const fallback = localApi()
    await fallback.init()
    fallback.mode = 'local-fallback'
    return fallback
  }
}

let apiPromise = null

export function getDataApi() {
  if (!apiPromise) {
    apiPromise = resolveApi()
  }
  return apiPromise
}
