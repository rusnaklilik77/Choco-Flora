import { useEffect, useRef, useState } from 'react'
import { THEMES, getThemeFromList } from './themes'
import { DEFAULT_MENU } from './data/menuData'
import { CATEGORIES, DEFAULT_PRODUCT_CATEGORY } from './data/categories'
import { loadLang, saveLang, DEFAULT_SITE_SETTINGS } from './utils/storage'
import { getDataApi } from './services/dataService'
import { getTranslations, DEFAULT_LANG } from './i18n'
import { auth, isFirebaseConfigured } from './firebase'
import { getFontStack } from './fonts'

import LoadingScreen from './components/LoadingScreen'
import ThemeBackdrop from './components/ThemeBackdrop'
import ParticleBackground from './components/ParticleBackground'
import MascotFigure from './components/MascotFigure'
import Header from './components/Header'
import CategoryNav from './components/CategoryNav'
import MenuGrid from './components/MenuGrid'
import MusicPlayer from './components/MusicPlayer'
import ProductModal from './components/ProductModal'
import AdminLoginModal from './components/AdminLoginModal'
import AdminPanel from './components/AdminPanel'

// Минимальная длина свайпа (в пикселях), чтобы посчитать его переключением
// категории — так навигация между разделами меню работает и жестом
// (свайп влево/вправо), а не только тапом по кнопке.
const SWIPE_THRESHOLD = 60

export default function App() {
  const [loading, setLoading] = useState(true)
  const [dataReady, setDataReady] = useState(false)
  const [themeId, setThemeId] = useState('default')
  const [themes, setThemes] = useState(THEMES)
  const [menu, setMenu] = useState(DEFAULT_MENU)
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [api, setApi] = useState(null)
  const [lang, setLang] = useState(() => loadLang(DEFAULT_LANG))
  const [activeCategory, setActiveCategory] = useState('all')
  const touchStartX = useRef(null)

  const theme = getThemeFromList(themes, themeId)
  const t = getTranslations(lang)

  const visibleMenu = activeCategory === 'all'
    ? menu
    : menu.filter((item) => (item.category || DEFAULT_PRODUCT_CATEGORY) === activeCategory)

  // Индивидуальная ссылка на товар (?item=ID, см. ProductModal.jsx) —
  // открывает нужную карточку сразу при заходе по ссылке, а закрытие
  // карточки работает через историю браузера: кнопка «назад» (и системный
  // жест «назад» на телефоне) закрывает карточку, а не сразу уходит с сайта.
  const [selectedItemId, setSelectedItemId] = useState(null)
  const selectedItem = menu.find((m) => m.id === selectedItemId) || null

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initialItem = params.get('item')
    if (initialItem) {
      // Сначала «чистое» состояние (главная), потом — открытая карточка.
      // Так «назад» всегда попадает на главную, даже если посетитель
      // пришёл сразу по ссылке на карточку (не было других переходов).
      window.history.replaceState({ item: null }, '', window.location.pathname)
      window.history.pushState({ item: initialItem }, '', `?item=${encodeURIComponent(initialItem)}`)
      setSelectedItemId(initialItem)
    }

    const onPopState = (e) => {
      setSelectedItemId(e.state?.item || null)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const openItem = (item) => {
    window.history.pushState({ item: item.id }, '', `?item=${encodeURIComponent(item.id)}`)
    setSelectedItemId(item.id)
  }

  const closeItem = () => {
    if (window.history.state?.item) {
      window.history.back()
    } else {
      setSelectedItemId(null)
    }
  }

  const handleChangeLang = (code) => {
    setLang(code)
    saveLang(code)
  }

  // Экран загрузки закрывается сам, без отдельной кнопки — музыку темы
  // при этом запускает MusicPlayer.jsx: пробует включить сразу, а если
  // браузер это заблокирует (обычная ситуация без действия посетителя),
  // запускает её по самому первому касанию/клику где угодно на странице.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1900)
    return () => clearTimeout(timer)
  }, [])

  // Свайп влево/вправо по области меню — переключает вкладку категории, как
  // это привычно на телефоне (жест вместо тапа по кнопке).
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches?.[0]?.clientX ?? null
  }
  const handleTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const endX = e.changedTouches?.[0]?.clientX ?? touchStartX.current
    const delta = endX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) < SWIPE_THRESHOLD) return
    const idx = CATEGORIES.findIndex((c) => c.id === activeCategory)
    if (idx === -1) return
    // Свайп влево (палец двигается к левому краю) -> следующая категория.
    const nextIdx = delta < 0
      ? Math.min(idx + 1, CATEGORIES.length - 1)
      : Math.max(idx - 1, 0)
    setActiveCategory(CATEGORIES[nextIdx].id)
  }

  // Инициализация источника данных (Firebase или локальный режим)
  useEffect(() => {
    let unsubMenu = () => {}
    let unsubTheme = () => {}
    let unsubThemes = () => {}
    let unsubSettings = () => {}

    getDataApi().then((dataApi) => {
      // getDataApi() уже дожидается dataApi.init() внутри себя (включая
      // автопереключение на локальный режим, если Firebase недоступен),
      // так что здесь просто подписываемся на данные.
      setApi(dataApi)
      unsubMenu = dataApi.subscribeMenu((items) => setMenu(items))
      unsubTheme = dataApi.subscribeSiteTheme((id) => setThemeId(id))
      unsubThemes = dataApi.subscribeThemes((list) => setThemes(list))
      unsubSettings = dataApi.subscribeSiteSettings((settings) => setSiteSettings(settings))
      setDataReady(true)
    }).catch((err) => {
      // Подстраховка на случай непредвиденной ошибки: не оставляем сайт
      // в вечном состоянии загрузки.
      console.error('[choco-flora] Не удалось инициализировать хранилище данных:', err)
      setDataReady(true)
    })

    return () => {
      unsubMenu()
      unsubTheme()
      unsubThemes()
      unsubSettings()
    }
  }, [])

  // Название сайта отражается и в заголовке вкладки браузера.
  useEffect(() => {
    document.title = `${siteSettings.siteTitle} — меню`
  }, [siteSettings.siteTitle])

  // Статус админа определяется исключительно сессией Firebase
  // Authentication: считается вошедшим только тот, кто реально
  // авторизовался через Firebase (и, соответственно, заранее добавлен как
  // пользователь в Firebase Console -> Authentication -> Users).
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setIsAdmin(false)
      return
    }
    let unsub = () => {}
    import('firebase/auth').then(({ onAuthStateChanged }) => {
      unsub = onAuthStateChanged(auth, (user) => {
        setIsAdmin(!!user)
      })
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    const r = document.documentElement
    r.style.setProperty('--bg-from', theme.colors.bgFrom)
    r.style.setProperty('--bg-to', theme.colors.bgTo)
    r.style.setProperty('--accent', theme.colors.accent)
    r.style.setProperty('--accent2', theme.colors.accent2)
    r.style.setProperty('--card', theme.colors.card)
    r.style.setProperty('--text', theme.colors.text)
  }, [theme])

  // Шрифт сайта выбирается в настройках админом и применяется через
  // CSS-переменную --site-font, которую использует body и заголовки.
  useEffect(() => {
    document.documentElement.style.setProperty('--site-font', getFontStack(siteSettings.fontFamily))
  }, [siteSettings.fontFamily])

  const handleSelectTheme = (id) => {
    api?.setSiteTheme(id)
  }

  const handleLogoClick = () => {
    if (isAdmin) {
      setShowAdminPanel(true)
    } else {
      setShowAdminLogin(true)
    }
  }

  const handleAdminSuccess = () => {
    // isAdmin выставится автоматически через onAuthStateChanged выше —
    // здесь только закрываем форму входа и открываем панель.
    setShowAdminLogin(false)
    setShowAdminPanel(true)
  }

  const handleAdminLogout = async () => {
    if (isFirebaseConfigured && auth) {
      const { signOut } = await import('firebase/auth')
      await signOut(auth)
    }
    setShowAdminPanel(false)
  }

  return (
    <div className="app-root">
      <LoadingScreen
        hidden={!loading}
        siteTitle={siteSettings.siteTitle}
        logoUrl={siteSettings.logoUrl}
      />

      <ThemeBackdrop theme={theme} />
      <ParticleBackground
        particles={theme.particles}
        particleImages={theme.particleImages}
        themeId={theme.id}
        sizeScale={theme.particleSize ?? 1}
      />
      <MascotFigure mascotItems={theme.mascotItems} themeId={theme.id} accent={theme.colors.accent} />

      <MusicPlayer songUrl={theme.songUrl} emoji={theme.emoji} label={theme.name} />

      <Header
        isAdmin={isAdmin}
        onLogoClick={handleLogoClick}
        t={t}
        lang={lang}
        onChangeLang={handleChangeLang}
        siteTitle={siteSettings.siteTitle}
        titleColor={siteSettings.titleColor}
        titleLetterColors={siteSettings.titleLetterColors}
        logoUrl={siteSettings.logoUrl}
      />

      <CategoryNav active={activeCategory} onChange={setActiveCategory} t={t} />

      <main className="menu-section" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <h2>{t.categories?.[activeCategory] || t.menuHeading}</h2>
        <MenuGrid items={visibleMenu} onSelect={openItem} emptyText={t.emptyMenu} />
      </main>

      <p className="footer-note">{siteSettings.siteTitle} · {siteSettings.phone}</p>

      <ProductModal item={selectedItem} onClose={closeItem} t={t} phone={siteSettings.phone} siteUrl={siteSettings.siteUrl} />

      {showAdminLogin && (
        <AdminLoginModal
          onClose={() => setShowAdminLogin(false)}
          onSuccess={handleAdminSuccess}
        />
      )}

      {showAdminPanel && dataReady && (
        <AdminPanel
          dataMode={api?.mode || 'local'}
          menu={menu}
          onAddItem={(item) => api.addMenuItem(item)}
          onUpdateItem={(id, item) => api.updateMenuItem(id, item)}
          onDeleteItem={(id) => api.deleteMenuItem(id)}
          themes={themes}
          currentThemeId={themeId}
          onSelectTheme={handleSelectTheme}
          onAddTheme={(theme) => api.addTheme(theme)}
          onUpdateTheme={(id, theme) => api.updateTheme(id, theme)}
          onDeleteTheme={(id) => api.deleteTheme(id)}
          settings={siteSettings}
          onUpdateSettings={(settings) => api.updateSiteSettings(settings)}
          onClose={() => setShowAdminPanel(false)}
          onLogout={handleAdminLogout}
        />
      )}
    </div>
  )
}
