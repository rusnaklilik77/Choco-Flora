import { useState } from 'react'
import AdminProductsPanel from './AdminProductsPanel'
import AdminThemesPanel from './AdminThemesPanel'
import AdminSiteSettingsPanel from './AdminSiteSettingsPanel'

export default function AdminPanel({
  menu, onAddItem, onUpdateItem, onDeleteItem,
  themes, currentThemeId, onSelectTheme,
  onAddTheme, onUpdateTheme, onDeleteTheme,
  siteSettings, onSaveSiteSettings,
  onClose, onLogout, dataMode,
}) {
  // null = вкладка не открыта, 'products' | 'themes' | 'settings' = какая попап-панель показана
  const [activeTab, setActiveTab] = useState(null)

  const isShared = dataMode === 'firebase'
  const isFallback = dataMode === 'local-fallback'

  return (
    <div className="admin-panel-overlay">
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>Панель администратора</h2>
          <button onClick={onClose} aria-label="Закрыть">✕</button>
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
            <span className="admin-tab-label">Настройки сайта</span>
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
        <AdminSiteSettingsPanel
          settings={siteSettings}
          onSave={onSaveSiteSettings}
          onClose={() => setActiveTab(null)}
        />
      )}
    </div>
  )
}
