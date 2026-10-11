import { useEffect, useRef, useState } from 'react'
import { THEMES, getThemeFromList } from './themes'
import { DEFAULT_CATALOG, sortGroups, getGroupName, getItemGroupId, makeId } from './data/categories'
import { loadLang, saveLang, loadAdminLang, saveAdminLang, DEFAULT_SITE_SETTINGS, loadBootCache, saveBootCache } from './utils/storage'
import { getDataApi } from './services/dataService'
import { getTranslations, DEFAULT_LANG } from './i18n'
import { AdminLangContext, makeAdminT, DEFAULT_ADMIN_LANG } from './adminI18n'
import { auth, isFirebaseConfigured } from './firebase'
import { getFontStack } from './fonts'

import LoadingScreen from './components/LoadingScreen'
import ThemeBackdrop from './components/ThemeBackdrop'
import ParticleBackground from './components/ParticleBackground'
import MascotFigure from './components/MascotFigure'
import Header from './components/Header'
import CategoryNav from './components/CategoryNav'
import FilterBar from './components/FilterBar'
import FilterPickerModal from './components/FilterPickerModal'
import FilterManagerModal from './components/FilterManagerModal'
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
  // Экран загрузки висит, пока НЕ выполнены все три условия: пришли данные
  // из базы (тема, настройки, группы, товары), прогрузились главные
  // картинки (фон темы и первые карточки) и прошло минимальное время
  // показа. Благодаря этому сначала НЕ мелькает «прежняя» встроенная тема.
  const [minTimePassed, setMinTimePassed] = useState(false)
  const [assetsReady, setAssetsReady] = useState(false)
  const [loadError, setLoadError] = useState(null)
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
  const [menu, setMenu] = useState([])
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [api, setApi] = useState(null)
  const [lang, setLang] = useState(() => loadLang(DEFAULT_LANG))
  const [catalog, setCatalog] = useState(DEFAULT_CATALOG)
  const [activeCategory, setActiveCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedFilters, setAppliedFilters] = useState([])
  const [showFilterPicker, setShowFilterPicker] = useState(false)
  const [showFilterManager, setShowFilterManager] = useState(false)
  const [adminLang, setAdminLang] = useState(() => loadAdminLang(DEFAULT_ADMIN_LANG))
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(DARK_MODE_KEY) === '1')
  const touchStartX = useRef(null)
  const bootCache = useRef(loadBootCache()).current

  const theme = getThemeFromList(themes, themeId)
  const t = getTranslations(lang)

  const groups = sortGroups(catalog.groups)
  const filters = catalog.filters
  const adminCtx = {
    lang: adminLang,
    setLang: (code) => { setAdminLang(code); saveAdminLang(code) },
    t: makeAdminT(adminLang),
  }

  // Главная группа — первая в списке. Если выбранной группы больше нет
  // (удалена админом) — переключаемся на главную.
  const currentGroupId = groups.some((g) => g.id === activeCategory)
    ? activeCategory
    : (groups[0]?.id ?? null)
  const currentGroup = groups.find((g) => g.id === currentGroupId) || null

  // Товары текущей группы (если групп нет совсем — просто всё меню).
  const groupItems = currentGroupId
    ? menu.filter((item) => getItemGroupId(item) === currentGroupId)
    : menu

  // Фильтры, которые ещё существуют (удалённые из выбора пропадают сами).
  const activeFilterIds = appliedFilters.filter((id) => filters.some((f) => f.id === id))

  // Поиск по названию + фильтры: товар должен иметь ВСЕ выбранные фильтры.
  const matchesSearch = (item, query) =>
    !query.trim() || (item.name || '').toLowerCase().includes(query.trim().toLowerCase())
  const matchesFilters = (item, ids) =>
    ids.every((id) => (item.filters || []).includes(id))
  const countMatching = (ids) =>
    groupItems.filter((item) => matchesSearch(item, searchQuery) && matchesFilters(item, ids)).length

  const visibleMenu = groupItems.filter(
    (item) => matchesSearch(item, searchQuery) && matchesFilters(item, activeFilterIds),
  )

  // Сколько товаров текущей группы имеет каждый фильтр (для фишек в окне
  // выбора) и сколько всего товаров использует фильтр (для окна управления).
  const filterCountsInGroup = {}
  const filterUsage = {}
  filters.forEach((f) => {
    filterCountsInGroup[f.id] = groupItems.filter((i) => (i.filters || []).includes(f.id)).length
    filterUsage[f.id] = menu.filter((i) => (i.filters || []).includes(f.id)).length
  })

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

  // Минимальное время показа экрана загрузки (чтобы он не «моргал», если
  // всё загрузилось мгновенно) и страховка: если база не отвечает дольше
  // 20 секунд — показываем понятную ошибку вместо вечной загрузки.
  useEffect(() => {
    const minTimer = setTimeout(() => setMinTimePassed(true), 1200)
    const failTimer = setTimeout(() => {
      setLoadError((prev) => prev || { code: 'timeout' })
    }, 20000)
    return () => {
      clearTimeout(minTimer)
      clearTimeout(failTimer)
    }
  }, [])

  const loading = loadError ? false : !(dataReady && assetsReady && minTimePassed)

  // Когда данные пришли — заранее подгружаем фон темы и первые карточки,
  // чтобы к моменту скрытия экрана загрузки они уже были готовы. Ждём не
  // дольше 5 секунд (медленный хостинг картинок не должен вешать сайт).
  useEffect(() => {
    if (!dataReady || assetsReady) return undefined
    const urls = []
    if (theme.bgImage && !theme.bgVideo) urls.push(theme.bgImage)
    visibleMenu.slice(0, 8).forEach((it) => {
      if (it.photos?.[0]) urls.push(it.photos[0])
    })
    let done = false
    const finish = () => {
      if (done) return
      done = true
      setAssetsReady(true)
    }
    const timer = setTimeout(finish, 5000)
    if (!urls.length) {
      finish()
      return () => clearTimeout(timer)
    }
    let left = urls.length
    const onSettled = () => {
      left -= 1
      if (left <= 0) finish()
    }
    urls.forEach((url) => {
      const img = new Image()
      img.referrerPolicy = 'no-referrer'
      img.onload = onSettled
      img.onerror = onSettled
      img.src = url
    })
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataReady])

  // Полностью убираем экран загрузки из разметки чуть позже, чем
  // начинается его исчезновение (0.6s CSS-переход), — см. комментарий
  // у showLoadingScreen выше.
  useEffect(() => {
    if (loading) return undefined
    if (loadError) return undefined
    const timer = setTimeout(() => setShowLoadingScreen(false), 700)
    return () => clearTimeout(timer)
  }, [loading, loadError])

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
    const idx = groups.findIndex((g) => g.id === currentGroupId)
    if (idx === -1) return
    // Свайп влево (палец двигается к левому краю) -> следующая группа.
    const nextIdx = deltaX < 0
      ? Math.min(idx + 1, groups.length - 1)
      : Math.max(idx - 1, 0)
    setActiveCategory(groups[nextIdx].id)
  }

  // Инициализация источника данных (Firebase или локальный режим).
  // dataReady становится true только когда ПРИШЛИ первые данные по всем
  // пяти подпискам: товары, список тем, выбранная тема, настройки сайта и
  // группы/фильтры.
  useEffect(() => {
    let cancelled = false
    let unsubs = []
    const got = new Set()
    const mark = (key) => {
      got.add(key)
      if (got.size >= 5 && !cancelled) setDataReady(true)
    }
    const fail = (err) => {
      console.error('[choco-flora] Не удалось загрузить данные:', err)
      if (!cancelled) setLoadError({ code: err?.code || 'unknown' })
    }

    getDataApi().then((dataApi) => {
      if (cancelled) return
      setApi(dataApi)
      unsubs = [
        dataApi.subscribeMenu((items) => { setMenu(items); mark('menu') }, fail),
        dataApi.subscribeSiteTheme((id) => { setThemeId(id); mark('themeId') }, fail),
        dataApi.subscribeThemes((list) => { setThemes(list); mark('themes') }, fail),
        dataApi.subscribeSiteSettings((settings) => { setSiteSettings(settings); mark('settings') }, fail),
        dataApi.subscribeCatalog((c) => { setCatalog(c); mark('catalog') }, fail),
      ]
    }).catch(fail)

    return () => {
      cancelled = true
      unsubs.forEach((u) => u())
    }
  }, [])

  // Запоминаем в этом браузере название, логотип и цвета темы — чтобы при
  // следующем заходе экран загрузки сразу выглядел «как надо».
  useEffect(() => {
    if (!dataReady) return
    saveBootCache({
      siteTitle: siteSettings.siteTitle,
      logoUrl: siteSettings.logoUrl,
      colors: theme.colors,
    })
  }, [dataReady, siteSettings.siteTitle, siteSettings.logoUrl, theme])

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
    // Пока данные не пришли — красим экран загрузки в цвета, сохранённые
    // с прошлого визита (если они есть), а не в цвета встроенной темы.
    const c = !dataReady && bootCache.colors ? bootCache.colors : theme.colors
    r.style.setProperty('--bg-from', c.bgFrom)
    r.style.setProperty('--bg-to', c.bgTo)
    r.style.setProperty('--accent', c.accent)
    r.style.setProperty('--accent2', c.accent2)
    r.style.setProperty('--card', c.card)
    r.style.setProperty('--text', c.text)
  }, [theme, dataReady])

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

  // ----- Группы и фильтры (редактируются в режиме админа) -----
  const handleSaveGroups = (nextGroups) => api.updateCatalog({ groups: nextGroups })

  const handleAddFilter = (name) =>
    api.updateCatalog({ filters: [...filters, { id: makeId('f'), name }] })

  const handleDeleteFilter = async (id) => {
    await api.updateCatalog({ filters: filters.filter((f) => f.id !== id) })
    // Убираем удалённый фильтр и у товаров, которые его использовали.
    const affected = menu.filter((i) => (i.filters || []).includes(id))
    await Promise.all(
      affected.map((i) => api.updateMenuItem(i.id, { filters: i.filters.filter((x) => x !== id) })),
    )
    setAppliedFilters((cur) => cur.filter((x) => x !== id))
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
    <AdminLangContext.Provider value={adminCtx}>
    <div className="app-root">
      {showLoadingScreen && (
        <LoadingScreen
          hidden={!loading}
          siteTitle={dataReady ? siteSettings.siteTitle : (bootCache.siteTitle || siteSettings.siteTitle)}
          logoUrl={dataReady ? siteSettings.logoUrl : (bootCache.logoUrl || siteSettings.logoUrl)}
          error={loadError}
          onRetry={() => window.location.reload()}
        />
      )}

      {dataReady && (
        <>
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

          <CategoryNav groups={groups} active={currentGroupId} onChange={setActiveCategory} lang={lang} t={t} />

          <FilterBar
            query={searchQuery}
            onQueryChange={setSearchQuery}
            activeFiltersCount={activeFilterIds.length}
            onOpenFilters={() => setShowFilterPicker(true)}
            t={t}
          />

          <main className="menu-section" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="menu-section-head">
              <h2>{currentGroup ? getGroupName(currentGroup, lang) : t.menuHeading}</h2>
            </div>
            <MenuGrid
              items={visibleMenu}
              onSelect={openItem}
              emptyText={
                groupItems.length && (searchQuery.trim() || activeFilterIds.length)
                  ? t.noResults
                  : t.emptyMenu
              }
            />
          </main>

          <p className="footer-note">{siteSettings.siteTitle} · {siteSettings.phone}</p>

          <ProductModal
            item={selectedItem}
            onClose={closeItem}
            t={t}
            phone={siteSettings.phone}
            siteUrl={siteSettings.siteUrl}
            filters={filters}
            onPrev={goToPrevItem}
            onNext={goToNextItem}
            hasPrev={hasPrevItem}
            hasNext={hasNextItem}
          />

        </>
      )}

      {showFilterPicker && (
        <FilterPickerModal
          key="picker"
          filters={filters}
          counts={filterCountsInGroup}
          selected={activeFilterIds}
          countMatching={countMatching}
          isAdmin={isAdmin}
          onApply={(ids) => { setAppliedFilters(ids); setShowFilterPicker(false) }}
          onManage={() => setShowFilterManager(true)}
          onClose={() => setShowFilterPicker(false)}
          t={t}
        />
      )}

      {showFilterManager && isAdmin && api && (
        <FilterManagerModal
          filters={filters}
          usage={filterUsage}
          onAdd={handleAddFilter}
          onDelete={handleDeleteFilter}
          onClose={() => setShowFilterManager(false)}
        />
      )}

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
          groups={groups}
          filters={filters}
          onSaveGroups={handleSaveGroups}
          onExportBackup={() => api.exportAll()}
          onImportBackup={(data) => api.importAll(data)}
          onManageFilters={() => setShowFilterManager(true)}
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
    </AdminLangContext.Provider>
  )
}
