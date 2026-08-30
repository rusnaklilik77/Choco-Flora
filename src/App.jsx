import { useEffect, useState } from 'react'
import { THEMES, getThemeFromList } from './themes'
import { DEFAULT_MENU } from './data/menuData'
import { loadLang, saveLang } from './utils/storage'
import { getDataApi } from './services/dataService'
import { getTranslations, DEFAULT_LANG } from './i18n'
import { auth, isFirebaseConfigured } from './firebase'

import LoadingScreen from './components/LoadingScreen'
import ThemeBackdrop from './components/ThemeBackdrop'
import ParticleBackground from './components/ParticleBackground'
import MascotFigure from './components/MascotFigure'
import Header from './components/Header'
import MenuGrid from './components/MenuGrid'
import ProductModal from './components/ProductModal'
import AdminLoginModal from './components/AdminLoginModal'
import AdminPanel from './components/AdminPanel'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [dataReady, setDataReady] = useState(false)
  const [themeId, setThemeId] = useState('default')
  const [themes, setThemes] = useState(THEMES)
  const [menu, setMenu] = useState(DEFAULT_MENU)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [api, setApi] = useState(null)
  const [lang, setLang] = useState(() => loadLang(DEFAULT_LANG))

  const theme = getThemeFromList(themes, themeId)
  const t = getTranslations(lang)

  const handleChangeLang = (code) => {
    setLang(code)
    saveLang(code)
  }

  // Инициализация источника данных (Firebase или локальный режим)
  useEffect(() => {
    let unsubMenu = () => {}
    let unsubTheme = () => {}
    let unsubThemes = () => {}

    getDataApi().then((dataApi) => {
      // getDataApi() уже дожидается dataApi.init() внутри себя (включая
      // автопереключение на локальный режим, если Firebase недоступен),
      // так что здесь просто подписываемся на данные.
      setApi(dataApi)
      unsubMenu = dataApi.subscribeMenu((items) => setMenu(items))
      unsubTheme = dataApi.subscribeSiteTheme((id) => setThemeId(id))
      unsubThemes = dataApi.subscribeThemes((list) => setThemes(list))
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
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1900)
    return () => clearTimeout(t)
  }, [])

  // Статус админа теперь определяется исключительно сессией Firebase
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
      <LoadingScreen hidden={!loading} />

      <ThemeBackdrop theme={theme} />
      <ParticleBackground
        particles={theme.particles}
        particleImages={theme.particleImages}
        themeId={theme.id}
      />
      <MascotFigure mascotItems={theme.mascotItems} themeId={theme.id} accent={theme.colors.accent} />

      <Header isAdmin={isAdmin} onLogoClick={handleLogoClick} t={t} lang={lang} onChangeLang={handleChangeLang} />

      <main className="menu-section">
        <h2>{t.menuHeading}</h2>
        <MenuGrid items={menu} onSelect={setSelectedItem} emptyText={t.emptyMenu} />
      </main>

      <p className="footer-note">Choco-Flora · +375 60 524 439</p>

      <ProductModal item={selectedItem} onClose={() => setSelectedItem(null)} t={t} />

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
          onClose={() => setShowAdminPanel(false)}
          onLogout={handleAdminLogout}
        />
      )}
    </div>
  )
}
