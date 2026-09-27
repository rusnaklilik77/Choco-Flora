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

// Тёмная/светлая тема ВСЕГО САЙТА (☀️/🌙 в шапке панели администратора).
// Раньше это состояние жило внутри AdminPanel.jsx и переключало класс
// на <body> только пока сама панель админа была открыта — из-за этого
// тёмный режим красил только элементы админки и не влиял на то, что
// видят посетители (карточки товара оставались светлыми). Теперь
// состояние поднято на уровень App: класс применяется независимо от
// того, открыта ли сейчас панель, поэтому включённая один раз тёмная
// тема остаётся активной и для витрины (карточек меню, окна товара)
// и для самой админки — в этом браузере, пока её не выключат обратно.
const DARK_MODE_KEY = 'choco_admin_dark_mode'

export default function App() {
  const [loading, setLoading] = useState(true)
  // Экран загрузки сначала плавно прячется (loading -> false, класс .hidden
  // с прозрачностью), а через время анимации (0.6s в CSS) полностью
  // убирается из разметки — а не просто остаётся невидимым поверх сайта.
  // Так он гарантированно не может случайно перехватывать клики/скролл
  // (колесо мыши, свайп на телефоне), даже если анимация или переход
  // отработают не так, как ожидалось.
  const [showLoadingScreen, setShowLoadingScreen] = useState(true)
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
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(DARK_MODE_KEY) === '1')
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

  // Позиция открытой карточки товара внутри ТЕКУЩЕГО видимого списка
  // (с учётом активного фильтра по категории) — нужна для кнопок/свайпа
  // «следующий/предыдущий товар» в окне карточки: листаем именно тот
  // раздел, который сейчас открыт, а не вперемешку все категории.
  const selectedIndex = visibleMenu.findIndex((m) => m.id === selectedItemId)
  const hasPrevItem = selectedIndex > 0
  const hasNextItem = selectedIndex !== -1 && selectedIndex < visibleMenu.length - 1

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

  // Переключение на соседний товар (вверх/вниз) внутри текущего видимого
  // списка. Используем replaceState (а не pushState, как в openItem) —
  // иначе каждое пролистывание добавляло бы отдельный шаг в историю
  // браузера, и кнопка «назад» листала бы товары один за другим вместо
  // мгновенного возврата на главную.
  const goToAdjacentItem = (delta) => {
    if (selectedIndex === -1) return
    const nextIndex = selectedIndex + delta
    if (nextIndex < 0 || nextIndex >= visibleMenu.length) return
    const nextItem = visibleMenu[nextIndex]
    window.history.replaceState({ item: nextItem.id }, '', `?item=${encodeURIComponent(nextItem.id)}`)
    setSelectedItemId(nextItem.id)
  }
  const goToPrevItem = () => goToAdjacentItem(-1)
  const goToNextItem = () => goToAdjacentItem(1)

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

  // Полностью убираем экран загрузки из разметки чуть позже, чем
  // начинается его исчезновение (0.6s CSS-переход), — см. комментарий
  // у showLoadingScreen выше.
  useEffect(() => {
    if (loading) return undefined
    const timer = setTimeout(() => setShowLoadingScreen(false), 700)
    return () => clearTimeout(timer)
  }, [loading])

  // Свайп влево/вправо по области меню — переключает вкладку категории, как
  // это привычно на телефоне (жест вместо тапа по кнопке). Вертикальный
  // скролл (вверх/вниз) этой областью намеренно не трогаем — это обычная
  // прокрутка страницы, и она должна работать как везде: пальцем на
  // телефоне и жестом на тачпаде компьютера, без перехвата в JS.
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches?.[0]?.clientX ?? null
  }
  const handleTouchEnd = (e) => {
    if (touchStartX.current == null) return
    const endX = e.changedTouches?.[0]?.clientX ?? touchStartX.current
    const deltaX = endX - touchStartX.current
    touchStartX.current = null

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return
    const idx = CATEGORIES.findIndex((c) => c.id === activeCategory)
    if (idx === -1) return
    // Свайп влево (палец двигается к левому краю) -> следующая категория.
    const nextIdx = deltaX < 0
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

  // Применяем тёмную тему сайта ко всему приложению (не только пока
  // открыта панель админа) и запоминаем выбор в этом браузере.
  useEffect(() => {
    document.body.classList.toggle('admin-dark-mode', darkMode)
    localStorage.setItem(DARK_MODE_KEY, darkMode ? '1' : '0')
  }, [darkMode])

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
      {showLoadingScreen && (
        <LoadingScreen
          hidden={!loading}
          siteTitle={siteSettings.siteTitle}
          logoUrl={siteSettings.logoUrl}
        />
      )}

      <ThemeBackdrop theme={theme} />
      <ParticleBackground
        particles={theme.particles}
        particleImages={theme.particleImages}
        themeId={theme.id}
        sizeScale={theme.particleSize ?? 1}
      />
      <MascotFigure mascotItems={theme.mascotItems} themeId={theme.id} accent={theme.colors.accent} />

      <MusicPlayer songUrl={theme.songUrl} />

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
        <div className="menu-section-head">
          <h2>{t.categories?.[activeCategory] || t.menuHeading}</h2>
        </div>
        <MenuGrid items={visibleMenu} onSelect={openItem} emptyText={t.emptyMenu} />
      </main>

      <p className="footer-note">{siteSettings.siteTitle} · {siteSettings.phone}</p>

      <ProductModal
        item={selectedItem}
        onClose={closeItem}
        t={t}
        phone={siteSettings.phone}
        siteUrl={siteSettings.siteUrl}
        onPrev={goToPrevItem}
        onNext={goToNextItem}
        hasPrev={hasPrevItem}
        hasNext={hasNextItem}
      />

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
          darkMode={darkMode}
          onToggleDarkMode={setDarkMode}
        />
      )}
    </div>
  )
}
