import { useEffect, useState } from 'react'
import AdminProductsPanel from './AdminProductsPanel'
import AdminThemesPanel from './AdminThemesPanel'
import AdminSettingsPanel from './AdminSettingsPanel'
import { sanitizeSiteUrl } from '../utils/storage'

const DARK_MODE_KEY = 'choco_admin_dark_mode'

export default function AdminPanel({
  menu, onAddItem, onUpdateItem, onDeleteItem,
  themes, currentThemeId, onSelectTheme,
  onAddTheme, onUpdateTheme, onDeleteTheme,
  settings, onUpdateSettings,
  onClose, onLogout, dataMode,
}) {
  // null = вкладка не открыта, 'products' | 'themes' = какая попап-панель показана
  const [activeTab, setActiveTab] = useState(null)
  const [showQr, setShowQr] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  // Тёмная/светлая тема ПАНЕЛИ АДМИНИСТРАТОРА (☀️ день / 🌙 ночь) — личная
  // настройка удобства работы в админке, не влияет на то, как сайт видят
  // посетители. Запоминается в этом браузере.
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(DARK_MODE_KEY) === '1')

  useEffect(() => {
    document.body.classList.toggle('admin-dark-mode', darkMode)
    localStorage.setItem(DARK_MODE_KEY, darkMode ? '1' : '0')
  }, [darkMode])

  const isShared = dataMode === 'firebase'
  const isFallback = dataMode === 'local-fallback'

  // Публичная ссылка на сайт — задаётся в Админка → Настройки (по
  // умолчанию https://choco-flora.vercel.app/), чтобы кнопка «Поделиться»
  // и QR-код всегда указывали на реальный адрес сайта. sanitizeSiteUrl
  // на всякий случай отбрасывает пустые/локальные (localhost) значения,
  // которые могли случайно сохраниться при тестировании — посетители
  // никогда не должны получить в QR-коде адрес localhost.
  const siteUrl = sanitizeSiteUrl(settings.siteUrl)
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(siteUrl)}`

  const handleShareSite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: settings.siteTitle || 'Choco-Flora', url: siteUrl })
        return
      } catch {
        return
      }
    }
    try {
      await navigator.clipboard.writeText(siteUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      window.prompt('Скопируйте ссылку на сайт:', siteUrl)
    }
  }

  return (
    <div className="admin-panel-overlay">
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>Панель администратора</h2>
          <div className="admin-panel-header-actions">
            <div className="admin-mode-toggle" role="group" aria-label="Тема панели администратора">
              <button
                type="button"
                className={!darkMode ? 'active' : ''}
                onClick={() => setDarkMode(false)}
                title="Светлая тема панели (день)"
                aria-label="Светлая тема панели"
              >
                ☀️
              </button>
              <button
                type="button"
                className={darkMode ? 'active' : ''}
                onClick={() => setDarkMode(true)}
                title="Тёмная тема панели (ночь)"
                aria-label="Тёмная тема панели"
              >
                🌙
              </button>
            </div>
            <button onClick={onClose} aria-label="Закрыть">✕</button>
          </div>
        </div>

        <p
          className="theme-picker-hint"
          style={{
            padding: '8px 10px',
            borderRadius: 8,
            background: isShared ? 'rgba(70,180,110,0.15)' : 'rgba(230,160,40,0.15)',
            border: `1px solid ${isShared ? 'rgba(70,180,110,0.4)' : 'rgba(230,160,40,0.4)'}`,
          }}
        >
          {isShared ? (
            <>✅ Режим сохранения: <strong>Firebase</strong> — изменения видят все посетители сайта.</>
          ) : isFallback ? (
            <>
              ⚠️ Не удалось подключиться к Firebase (проверьте ключи и правила доступа Firestore —
              подробности в консоли браузера, F12). Сейчас сайт временно работает в режиме
              <strong> «только этот браузер»</strong> — изменения сохраняются, но видны только здесь.
            </>
          ) : (
            <>
              ⚠️ Режим сохранения: <strong>только этот браузер</strong>. Все изменения (товары, темы)
              сохраняются, но видны только здесь, на этом устройстве — другие посетители их не увидят.
              Чтобы изменения были общими для всех, подключите Firebase (см. README.md, раздел
              «Подключение Firebase»).
            </>
          )}
        </p>

        <div className="admin-share-site">
          <div className="admin-share-site-url">🌐 {siteUrl}</div>
          <div className="admin-share-site-actions">
            <button type="button" className="admin-add-btn admin-add-btn-small" onClick={handleShareSite}>
              {linkCopied ? '✅ Скопировано' : '🔗 Поделиться сайтом'}
            </button>
            <button
              type="button"
              className="admin-add-btn admin-add-btn-small"
              onClick={() => setShowQr((v) => !v)}
            >
              📱 {showQr ? 'Скрыть QR-код' : 'QR-код сайта'}
            </button>
          </div>
          {showQr && (
            <div className="admin-qr-wrap">
              <img src={qrImageUrl} alt="QR-код на сайт" width={200} height={200} />
              <span className="theme-picker-hint" style={{ marginTop: 6, textAlign: 'center' }}>
                Дайте отсканировать — камера телефона откроет сайт напрямую.
              </span>
            </div>
          )}
        </div>

        <p className="theme-picker-hint">Выберите раздел, чтобы открыть его.</p>

        <div className="admin-tabs">
          <button className="admin-tab-btn" onClick={() => setActiveTab('products')}>
            <span className="admin-tab-icon">🍫</span>
            <span className="admin-tab-label">Товары</span>
            <span className="admin-tab-count">{menu.length}</span>
          </button>
          <button className="admin-tab-btn" onClick={() => setActiveTab('themes')}>
            <span className="admin-tab-icon">🎨</span>
            <span className="admin-tab-label">Темы</span>
            <span className="admin-tab-count">{themes.length}</span>
          </button>
          <button className="admin-tab-btn" onClick={() => setActiveTab('settings')}>
            <span className="admin-tab-icon">⚙️</span>
            <span className="admin-tab-label">Настройки</span>
          </button>
        </div>

        <button
          className="admin-add-btn"
          style={{ marginTop: 18, borderColor: 'rgba(0,0,0,0.2)', color: 'inherit' }}
          onClick={onLogout}
        >
          Выйти из режима админа
        </button>
      </div>

      {activeTab === 'products' && (
        <AdminProductsPanel
          menu={menu}
          onAddItem={onAddItem}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onClose={() => setActiveTab(null)}
        />
      )}

      {activeTab === 'themes' && (
        <AdminThemesPanel
          themes={themes}
          currentThemeId={currentThemeId}
          onSelectTheme={onSelectTheme}
          onAddTheme={onAddTheme}
          onUpdateTheme={onUpdateTheme}
          onDeleteTheme={onDeleteTheme}
          onClose={() => setActiveTab(null)}
        />
      )}

      {activeTab === 'settings' && (
        <AdminSettingsPanel
          settings={settings}
          onSave={onUpdateSettings}
          onClose={() => setActiveTab(null)}
        />
      )}
    </div>
  )
}
