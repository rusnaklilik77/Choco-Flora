import { useState } from 'react'
import AdminProductsPanel from './AdminProductsPanel'
import AdminThemesPanel from './AdminThemesPanel'
import AdminSettingsPanel from './AdminSettingsPanel'
import AdminGroupsPanel from './AdminGroupsPanel'
import { useAdminT } from '../adminI18n'
import { sanitizeSiteUrl } from '../utils/storage'

export default function AdminPanel({
  menu, onAddItem, onUpdateItem, onDeleteItem,
  groups, filters, onSaveGroups, onManageFilters,
  themes, currentThemeId, onSelectTheme,
  onAddTheme, onUpdateTheme, onDeleteTheme,
  settings, onUpdateSettings,
  onClose, onLogout, dataMode,
  darkMode, onToggleDarkMode,
}) {
  const { t } = useAdminT()
  // null = вкладка не открыта, 'products' | 'groups' | 'themes' | 'settings'
  const [activeTab, setActiveTab] = useState(null)
  const [showQr, setShowQr] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

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
      window.prompt(t('copyPrompt'), siteUrl)
    }
  }

  return (
    <div className="admin-panel-overlay">
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h2>{t('panelTitle')}</h2>
          <div className="admin-panel-header-actions">
            <div className="admin-mode-toggle" role="group" aria-label={t('themeToggleLabel')}>
              <button
                type="button"
                className={!darkMode ? 'active' : ''}
                onClick={() => onToggleDarkMode(false)}
                title={t('lightTitle')}
                aria-label={t('lightTitle')}
              >
                ☀️
              </button>
              <button
                type="button"
                className={darkMode ? 'active' : ''}
                onClick={() => onToggleDarkMode(true)}
                title={t('darkTitle')}
                aria-label={t('darkTitle')}
              >
                🌙
              </button>
            </div>
            <button onClick={onClose} aria-label={t('close')}>✕</button>
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
          {isShared ? t('modeFirebase') : isFallback ? t('modeFallback') : t('modeLocal')}
        </p>

        <div className="admin-share-site">
          <div className="admin-share-site-url">🌐 {siteUrl}</div>
          <div className="admin-share-site-actions">
            <button type="button" className="admin-add-btn admin-add-btn-small" onClick={handleShareSite}>
              {linkCopied ? t('copied') : t('shareSite')}
            </button>
            <button
              type="button"
              className="admin-add-btn admin-add-btn-small"
              onClick={() => setShowQr((v) => !v)}
            >
              📱 {showQr ? t('qrHide') : t('qrShow')}
            </button>
          </div>
          {showQr && (
            <div className="admin-qr-wrap">
              <img src={qrImageUrl} alt={t('qrAlt')} width={200} height={200} />
              <span className="theme-picker-hint" style={{ marginTop: 6, textAlign: 'center' }}>
                {t('qrHint')}
              </span>
            </div>
          )}
        </div>

        <p className="theme-picker-hint">{t('chooseSection')}</p>

        <div className="admin-tabs">
          <button className="admin-tab-btn" onClick={() => setActiveTab('products')}>
            <span className="admin-tab-icon">🍫</span>
            <span className="admin-tab-label">{t('tabProducts')}</span>
            <span className="admin-tab-count">{menu.length}</span>
          </button>
          <button className="admin-tab-btn" onClick={() => setActiveTab('groups')}>
            <span className="admin-tab-icon">🗂️</span>
            <span className="admin-tab-label">{t('tabGroups')}</span>
            <span className="admin-tab-count">{groups.length}</span>
          </button>
          <button className="admin-tab-btn" onClick={onManageFilters}>
            <span className="admin-tab-icon">🏷️</span>
            <span className="admin-tab-label">{t('tabFilters')}</span>
            <span className="admin-tab-count">{filters.length}</span>
          </button>
          <button className="admin-tab-btn" onClick={() => setActiveTab('themes')}>
            <span className="admin-tab-icon">🎨</span>
            <span className="admin-tab-label">{t('tabThemes')}</span>
            <span className="admin-tab-count">{themes.length}</span>
          </button>
          <button className="admin-tab-btn" onClick={() => setActiveTab('settings')}>
            <span className="admin-tab-icon">⚙️</span>
            <span className="admin-tab-label">{t('tabSettings')}</span>
          </button>
        </div>

        <button
          className="admin-add-btn"
          style={{ marginTop: 18, borderColor: 'rgba(0,0,0,0.2)', color: 'inherit' }}
          onClick={onLogout}
        >
          {t('logout')}
        </button>
      </div>

      {activeTab === 'products' && (
        <AdminProductsPanel
          menu={menu}
          groups={groups}
          filters={filters}
          onManageFilters={onManageFilters}
          onAddItem={onAddItem}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
          onClose={() => setActiveTab(null)}
        />
      )}

      {activeTab === 'groups' && (
        <AdminGroupsPanel
          groups={groups}
          menu={menu}
          onSaveGroups={onSaveGroups}
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
