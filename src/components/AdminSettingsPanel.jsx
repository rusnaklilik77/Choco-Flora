import { useState } from 'react'
import { toDirectImageUrl, isGoogleDriveLink } from '../utils/driveTools'
import { sanitizeSiteUrl } from '../utils/storage'
import { SITE_FONTS } from '../fonts'
import { useAdminT, ADMIN_LANGUAGES } from '../adminI18n'

const DEFAULT_LETTER_COLOR = '#ffffff'

// Приводит массив цветов букв к длине названия: лишнее обрезаем,
// недостающее дополняем null (null = «цвет не задан», буква остаётся
// в фирменной раскраске сайта).
function normalizeLetterColors(title, colors) {
  const list = Array.isArray(colors) ? colors : []
  return title.split('').map((_, i) => list[i] || null)
}

export default function AdminSettingsPanel({ settings, onSave, onClose }) {
  const { t, lang, setLang } = useAdminT()
  const [form, setForm] = useState({
    ...settings,
    fontFamily: settings.fontFamily || 'fredoka',
    letterColors: normalizeLetterColors(settings.siteTitle || '', settings.titleLetterColors),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const update = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    setSaved(false)
    setError('')
  }

  const handleTitleChange = (value) => {
    setForm((f) => ({
      ...f,
      siteTitle: value,
      letterColors: normalizeLetterColors(value, f.letterColors),
    }))
    setSaved(false)
    setError('')
  }

  const setLetterColor = (index, color) => {
    setForm((f) => {
      const next = normalizeLetterColors(f.siteTitle || '', f.letterColors)
      next[index] = color
      return { ...f, letterColors: next }
    })
    setSaved(false)
  }

  const clearLetterColor = (index) => {
    setForm((f) => {
      const next = normalizeLetterColors(f.siteTitle || '', f.letterColors)
      next[index] = null
      return { ...f, letterColors: next }
    })
    setSaved(false)
  }

  const handleSave = async () => {
    if (!form.siteTitle.trim()) {
      setError(t('titleRequired'))
      return
    }
    setSaving(true)
    setError('')
    try {
      const title = form.siteTitle.trim()
      const letters = normalizeLetterColors(title, form.letterColors)
      const anyColor = letters.some(Boolean)

      await onSave({
        siteTitle: title,
        titleColor: form.titleColor || DEFAULT_LETTER_COLOR,
        // null → название показывается в обычной фирменной раскраске сайта
        titleLetterColors: anyColor ? letters : null,
        fontFamily: form.fontFamily || 'fredoka',
        logoUrl: form.logoUrl ? toDirectImageUrl(form.logoUrl) : '/logo.png',
        phone: (form.phone || '').trim(),
        siteUrl: sanitizeSiteUrl(form.siteUrl),
      })
      setSaved(true)
    } catch (err) {
      console.error('[choco-flora] Не удалось сохранить настройки сайта:', err)
      setError(t('settingsSaveFail'))
    } finally {
      setSaving(false)
    }
  }

  const letters = normalizeLetterColors(form.siteTitle || '', form.letterColors)
  const currentFont = SITE_FONTS.find((f) => f.id === form.fontFamily) || SITE_FONTS[0]

  return (
    <div className="admin-panel-overlay nested" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="admin-panel-header">
          <h2>{t('settingsTitle')}</h2>
          <button onClick={onClose} aria-label={t('close')}>✕</button>
        </div>

        <div className="admin-lang-block">
          <div className="admin-lang-title">🌐 {t('adminLangTitle')}</div>
          <div className="admin-lang-options" role="group" aria-label={t('adminLangTitle')}>
            {ADMIN_LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                className={`admin-lang-btn ${lang === l.code ? 'active' : ''}`}
                onClick={() => setLang(l.code)}
                aria-pressed={lang === l.code}
              >
                <span className="admin-lang-flag">{l.flag}</span> {l.label}
              </button>
            ))}
          </div>
          <p className="theme-picker-hint" style={{ margin: '8px 0 0' }}>{t('adminLangHint')}</p>
        </div>

        <p className="theme-picker-hint" style={{ marginTop: 0 }}>
          {t('settingsIntro')}
        </p>

        <div className="admin-form">
          <label htmlFor="site-title">{t('siteTitle')}</label>
          <input
            id="site-title"
            name="site-title"
            value={form.siteTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Choco-Flora"
          />

          <label style={{ marginTop: 14 }}>{t('letterColors')}</label>
          <p className="theme-picker-hint" style={{ marginTop: 0 }}>
            {t('letterColorsHint')}
          </p>
          <div className="letter-color-grid">
            {(form.siteTitle || '').split('').map((char, i) => (
              <div className="letter-color-cell" key={i}>
                <span>{char === ' ' ? '␣' : char}</span>
                <input
                  type="color"
                  id={`letter-color-${i}`}
                  name={`letter-color-${i}`}
                  className={letters[i] ? 'is-set' : 'is-empty'}
                  value={letters[i] || DEFAULT_LETTER_COLOR}
                  onChange={(e) => setLetterColor(i, e.target.value)}
                  title={letters[i] ? t('letterColorSet') : t('letterColorEmpty')}
                />
                {letters[i] && (
                  <button
                    type="button"
                    className="letter-color-clear"
                    onClick={() => clearLetterColor(i)}
                    title={t('letterColorReset')}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <label htmlFor="site-font" style={{ marginTop: 14 }}>{t('siteFont')}</label>
          <select
            id="site-font"
            name="site-font"
            className="admin-select"
            value={form.fontFamily || 'fredoka'}
            onChange={(e) => update({ fontFamily: e.target.value })}
          >
            {SITE_FONTS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
          <p
            className="theme-picker-hint font-preview"
            style={{ fontFamily: currentFont.stack }}
          >
            {form.siteTitle || 'Choco-Flora'} — {t('fontSample')}
          </p>

          <label htmlFor="site-logo" style={{ marginTop: 14 }}>
            {t('logoLabel')}
          </label>
          <div className="theme-bg-preview">
            <img
              src={form.logoUrl ? toDirectImageUrl(form.logoUrl) : '/logo.png'}
              alt={t('logoAlt')}
              referrerPolicy="no-referrer"
            />
            {form.logoUrl && form.logoUrl !== '/logo.png' && (
              <button type="button" className="remove-x" onClick={() => update({ logoUrl: '' })}>✕</button>
            )}
          </div>
          <input
            id="site-logo"
            name="site-logo"
            value={form.logoUrl === '/logo.png' ? '' : (form.logoUrl || '')}
            onChange={(e) => update({ logoUrl: e.target.value })}
            placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
          />
          {form.logoUrl && isGoogleDriveLink(form.logoUrl) ? (
            <span className="link-hint">{t('driveHint')}</span>
          ) : (
            <span className="link-hint">{t('logoEmptyHint')}</span>
          )}

          <label htmlFor="site-phone" style={{ marginTop: 14 }}>{t('phone')}</label>
          <input
            id="site-phone"
            name="site-phone"
            type="tel"
            autoComplete="tel"
            value={form.phone || ''}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="+373 69 716 541"
          />

          <label htmlFor="site-url" style={{ marginTop: 14 }}>{t('siteUrl')}</label>
          <p className="theme-picker-hint" style={{ marginTop: 0 }}>
            {t('siteUrlHint')}
          </p>
          <input
            id="site-url"
            name="site-url"
            type="url"
            value={form.siteUrl || ''}
            onChange={(e) => update({ siteUrl: e.target.value })}
            placeholder="https://choco-flora.vercel.app/"
          />

          {error && <div className="admin-login-error">{error}</div>}
          {saved && !error && <div className="settings-saved-hint">{t('settingsSaved')}</div>}

          <div className="admin-form-actions">
            <button className="save" onClick={handleSave} disabled={saving}>
              {saving ? t('saving') : t('save')}
            </button>
            <button className="cancel" onClick={onClose} disabled={saving}>{t('cancel')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
