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

import { db, auth, isFirebaseConfigured } from '../firebase'
import { DEFAULT_MENU } from '../data/menuData'
import { THEMES as SEED_THEMES } from '../themes'
import { DEFAULT_CATALOG } from '../data/categories'
import {
  loadMenu, saveMenu,
  loadThemeId, saveThemeId,
  loadCustomThemes, saveCustomThemes,
  loadSiteSettings, saveSiteSettings,
  loadCatalog, saveCatalog, CATALOG_KEY,
  DEFAULT_SITE_SETTINGS, SITE_SETTINGS_KEY,
} from '../utils/storage'

// Логин админа больше не хранится и не проверяется здесь: вход в админку
// идёт напрямую через Firebase Authentication (см. src/firebase.js и
// src/components/AdminLoginModal.jsx). Кто может войти — управляется в
// Firebase Console -> Authentication -> Users, а не в этом файле.

// ---------------------------------------------------------------------
// РЕЖИМ FIREBASE
// ---------------------------------------------------------------------
async function firestoreApi() {
  const {
    collection, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc,
    getDoc, getDocs, serverTimestamp,
  } = await import('firebase/firestore')

  // Слушатель, который игнорирует «снимки из кэша». Если у посетителя
  // нет связи с базой, Firestore сначала отдаёт ПУСТОЙ снимок из локального
  // кэша — и сайт показывал бы «Меню пока пустое», хотя товары на месте.
  // Именно это выглядело как «всё исчезло». Теперь данные принимаются
  // только когда они реально пришли с сервера; иначе через 20 секунд
  // показывается экран ошибки с кнопкой «Повторить» (см. App.jsx).
  const listen = (ref, cb, onError) =>
    onSnapshot(ref, { includeMetadataChanges: true }, (snap) => {
      if (snap.metadata.fromCache) return
      cb(snap)
    }, onError)

  const menuCol = collection(db, 'menu')
  const themesCol = collection(db, 'themes')
  const siteDoc = doc(db, 'settings', 'site')
  // Группы и фильтры лежат в одном маленьком документе settings/catalog —
  // коллекция settings уже открыта правилами Firestore, поэтому менять
  // firestore.rules не нужно.
  const catalogDoc = doc(db, 'settings', 'catalog')

  // Первичное наполнение базы (меню, встроенные темы, группы/фильтры) —
  // ОДИН раз за всю жизнь проекта. Раньше сайт при КАЖДОМ запуске
  // проверял «а не пуста ли коллекция?» и, если пуста, заново записывал
  // демо-товары; к тому же любая ошибка здесь молча переключала сайт на
  // локальный режим, и опубликованные товары «пропадали». Теперь:
  //  - наполнение делается только вошедшим админом (посетитель писать не
  //    может, и пытаться незачем);
  //  - после первого наполнения в settings/site ставится флаг seeded, и
  //    больше сайт ничего не добавляет сам — удалённое вами не вернётся;
  //  - любая ошибка здесь только пишется в консоль и НЕ влияет на сайт.
  async function ensureSeed() {
    try {
      if (auth && typeof auth.authStateReady === 'function') await auth.authStateReady()
      if (!auth || !auth.currentUser) return

      const siteSnap = await getDoc(siteDoc)
      const data = siteSnap.exists() ? siteSnap.data() : {}

      // Дозаполняем только отсутствующие поля настроек, ничего не трогая.
      const missing = {}
      for (const key of Object.keys(DEFAULT_SITE_SETTINGS)) {
        if (data[key] === undefined) missing[key] = DEFAULT_SITE_SETTINGS[key]
      }
      if (!siteSnap.exists()) missing.themeId = 'default'

      if (!data.seeded) {
        const menuSnap = await getDocs(menuCol)
        if (menuSnap.empty) {
          await Promise.all(
            DEFAULT_MENU.map((item) => {
              const { id, ...rest } = item
              return setDoc(doc(db, 'menu', id), rest)
            })
          )
        }
        const themesSnap = await getDocs(themesCol)
        if (themesSnap.empty) {
          await Promise.all(
            SEED_THEMES.map((theme) => {
              const { id, ...rest } = theme
              return setDoc(doc(db, 'themes', id), {
                ...rest,
                bgImage: rest.bgImage || null,
                bgVideo: rest.bgVideo || null,
                particleImages: rest.particleImages || [],
              })
            })
          )
        }
        const catalogSnap = await getDoc(catalogDoc)
        if (!catalogSnap.exists()) {
          await setDoc(catalogDoc, DEFAULT_CATALOG)
        }
        missing.seeded = true
      }

      if (Object.keys(missing).length) {
        await setDoc(siteDoc, missing, { merge: true })
      }
    } catch (err) {
      console.warn('[choco-flora] Первичное наполнение базы пропущено:', err)
    }
  }

  return {
    mode: 'firebase',

    async init() {
      // Не ждём: наполнение базы идёт в фоне и никогда не задерживает и
      // не ломает загрузку сайта.
      ensureSeed()
    },

    subscribeMenu(callback, onError) {
      return listen(menuCol, (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      }, onError)
    },

    subscribeSiteTheme(callback, onError) {
      return listen(siteDoc, (snap) => {
        callback(snap.exists() ? snap.data().themeId || 'default' : 'default')
      }, onError)
    },

    subscribeThemes(callback, onError) {
      return listen(themesCol, (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      }, onError)
    },

    subscribeSiteSettings(callback, onError) {
      return listen(siteDoc, (snap) => {
        const data = snap.exists() ? snap.data() : {}
        callback({
          siteTitle: data.siteTitle || DEFAULT_SITE_SETTINGS.siteTitle,
          titleColor: data.titleColor || DEFAULT_SITE_SETTINGS.titleColor,
          titleLetterColors: Array.isArray(data.titleLetterColors) && data.titleLetterColors.length
            ? data.titleLetterColors
            : DEFAULT_SITE_SETTINGS.titleLetterColors,
          fontFamily: data.fontFamily || DEFAULT_SITE_SETTINGS.fontFamily,
          logoUrl: data.logoUrl || DEFAULT_SITE_SETTINGS.logoUrl,
          phone: data.phone || DEFAULT_SITE_SETTINGS.phone,
          siteUrl: data.siteUrl || DEFAULT_SITE_SETTINGS.siteUrl,
        })
      }, onError)
    },

    subscribeCatalog(callback, onError) {
      return listen(catalogDoc, (snap) => {
        const data = snap.exists() ? snap.data() : {}
        callback({
          groups: Array.isArray(data.groups) ? data.groups : DEFAULT_CATALOG.groups,
          filters: Array.isArray(data.filters) ? data.filters : DEFAULT_CATALOG.filters,
        })
      }, onError)
    },

    // patch: { groups?, filters? } — записываем целиком нужный массив.
    async updateCatalog(patch) {
      await setDoc(catalogDoc, patch, { merge: true })
    },


    // ----- Резервная копия: выгрузка и восстановление -----
    async exportAll() {
      const [menuSnap, themesSnap, siteSnap, catalogSnap] = await Promise.all([
        getDocs(menuCol), getDocs(themesCol), getDoc(siteDoc), getDoc(catalogDoc),
      ])
      const settings = siteSnap.exists() ? { ...siteSnap.data() } : {}
      delete settings.updatedAt
      return {
        app: 'choco-flora-backup',
        version: 1,
        exportedAt: new Date().toISOString(),
        menu: menuSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        themes: themesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        catalog: catalogSnap.exists() ? catalogSnap.data() : DEFAULT_CATALOG,
        settings,
      }
    },

    // Только добавляет/обновляет по ID — ничего не удаляет.
    async importAll(data) {
      for (const item of data.menu || []) {
        const { id, ...rest } = item
        if (id) await setDoc(doc(db, 'menu', id), rest)
      }
      for (const theme of data.themes || []) {
        const { id, ...rest } = theme
        if (id) await setDoc(doc(db, 'themes', id), rest)
      }
      if (data.catalog) await setDoc(catalogDoc, data.catalog, { merge: true })
      if (data.settings) {
        const { updatedAt: _u, ...rest } = data.settings
        await setDoc(siteDoc, { ...rest, seeded: true }, { merge: true })
      }
    },

    async setSiteTheme(themeId) {
      await setDoc(siteDoc, { themeId, updatedAt: serverTimestamp() }, { merge: true })
    },

    async updateSiteSettings(settings) {
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
  const listeners = { menu: new Set(), theme: new Set(), themes: new Set(), settings: new Set(), catalog: new Set() }

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
    if (e.key === CATALOG_KEY) {
      listeners.catalog.forEach((cb) => cb(loadCatalog(DEFAULT_CATALOG)))
    }
    if (e.key === SITE_SETTINGS_KEY) {
      listeners.settings.forEach((cb) => cb(loadSiteSettings(DEFAULT_SITE_SETTINGS)))
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

    subscribeSiteSettings(callback) {
      callback(loadSiteSettings(DEFAULT_SITE_SETTINGS))
      listeners.settings.add(callback)
      return () => listeners.settings.delete(callback)
    },

    subscribeCatalog(callback) {
      callback(loadCatalog(DEFAULT_CATALOG))
      listeners.catalog.add(callback)
      return () => listeners.catalog.delete(callback)
    },

    async updateCatalog(patch) {
      const next = { ...loadCatalog(DEFAULT_CATALOG), ...patch }
      saveCatalog(next)
      listeners.catalog.forEach((cb) => cb(next))
    },


    async exportAll() {
      return {
        app: 'choco-flora-backup',
        version: 1,
        exportedAt: new Date().toISOString(),
        menu: loadMenu(DEFAULT_MENU),
        themes: seedLocalThemesIfNeeded(),
        catalog: loadCatalog(DEFAULT_CATALOG),
        settings: { ...loadSiteSettings(DEFAULT_SITE_SETTINGS), themeId: loadThemeId('default') },
      }
    },

    async importAll(data) {
      if (Array.isArray(data.menu) && data.menu.length) {
        const byId = new Map(loadMenu(DEFAULT_MENU).map((i) => [i.id, i]))
        data.menu.forEach((i) => byId.set(i.id, i))
        const next = [...byId.values()]
        saveMenu(next)
        listeners.menu.forEach((cb) => cb(next))
      }
      if (Array.isArray(data.themes) && data.themes.length) {
        const byId = new Map(seedLocalThemesIfNeeded().map((i) => [i.id, i]))
        data.themes.forEach((i) => byId.set(i.id, i))
        const next = [...byId.values()]
        saveCustomThemes(next)
        listeners.themes.forEach((cb) => cb(next))
      }
      if (data.catalog) {
        const next = { ...loadCatalog(DEFAULT_CATALOG), ...data.catalog }
        saveCatalog(next)
        listeners.catalog.forEach((cb) => cb(next))
      }
    },

    async setSiteTheme(themeId) {
      saveThemeId(themeId)
      listeners.theme.forEach((cb) => cb(themeId))
    },

    async updateSiteSettings(settings) {
      const current = loadSiteSettings(DEFAULT_SITE_SETTINGS)
      const next = { ...current, ...settings }
      saveSiteSettings(next)
      listeners.settings.forEach((cb) => cb(next))
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
  }
}

// ---------------------------------------------------------------------
// ВЫБОР РЕЖИМА
// ---------------------------------------------------------------------
// Ключи Firebase прописаны -> ВСЕГДА работаем только через Firebase.
//
// Раньше при любой ошибке сайт молча переключался на localStorage
// браузера. Для посетителя это выглядело как «все опубликованные товары
// исчезли», хотя в Firestore они лежали целыми, а всё, что админ
// добавлял в таком режиме, оставалось только в его браузере. Теперь
// тихого отката нет: если база недоступна, сайт честно показывает
// ошибку с кнопкой «Повторить» (см. App.jsx / LoadingScreen.jsx), а
// данные в базе остаются нетронутыми.
async function resolveApi() {
  if (!isFirebaseConfigured) {
    const api = localApi()
    await api.init()
    return api
  }
  const api = await firestoreApi()
  await api.init()
  return api
}

let apiPromise = null

export function getDataApi() {
  if (!apiPromise) {
    apiPromise = resolveApi()
  }
  return apiPromise
}
