import { useState } from 'react'
import { toDirectImageUrl, isGoogleDriveLink } from '../utils/driveTools'
import { sanitizeSiteUrl } from '../utils/storage'
import { SITE_FONTS } from '../fonts'

const DEFAULT_LETTER_COLOR = '#ffffff'

// Приводит массив цветов букв к длине названия: лишнее обрезаем,
// недостающее дополняем null (null = «цвет не задан», буква остаётся
// в фирменной раскраске сайта).
function normalizeLetterColors(title, colors) {
  const list = Array.isArray(colors) ? colors : []
  return title.split('').map((_, i) => list[i] || null)
}

export default function AdminSettingsPanel({ settings, onSave, onClose }) {
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
      setError('Введите название сайта')
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
      setError('Не удалось сохранить настройки. Проверьте интернет-соединение и попробуйте ещё раз.')
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
          <h2>⚙️ Настройки сайта</h2>
          <button onClick={onClose} aria-label="Закрыть">✕</button>
        </div>

        <p className="theme-picker-hint" style={{ marginTop: 0 }}>
          Название, логотип и номер телефона видны всем посетителям сайта — в шапке
          страницы и в подвале рядом с телефоном.
        </p>

        <div className="admin-form">
          <label htmlFor="site-title">Название сайта</label>
          <input
            id="site-title"
            name="site-title"
            value={form.siteTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Choco-Flora"
          />

          <label style={{ marginTop: 14 }}>Цвет каждой буквы названия (необязательно)</label>
          <p className="theme-picker-hint" style={{ marginTop: 0 }}>
            Задайте цвет отдельным буквам названия сайта. Если ничего не менять —
            название останется в прежней фирменной раскраске.
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
                  title={letters[i] ? 'Цвет буквы (нажмите ✕, чтобы сбросить)' : 'Цвет не задан'}
                />
                {letters[i] && (
                  <button
                    type="button"
                    className="letter-color-clear"
                    onClick={() => clearLetterColor(i)}
                    title="Сбросить цвет буквы"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <label htmlFor="site-font" style={{ marginTop: 14 }}>Шрифт сайта</label>
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
            {form.siteTitle || 'Choco-Flora'} — пример шрифта
          </p>

          <label htmlFor="site-logo" style={{ marginTop: 14 }}>
            Логотип (ссылка на картинку, например с Google Диска)
          </label>
          <div className="theme-bg-preview">
            <img
              src={form.logoUrl ? toDirectImageUrl(form.logoUrl) : '/logo.png'}
              alt="Логотип"
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
            <span className="link-hint">Ссылка с Google Диска — конвертируется в прямую автоматически.</span>
          ) : (
            <span className="link-hint">Поле пустое — используется логотип по умолчанию.</span>
          )}

          <label htmlFor="site-phone" style={{ marginTop: 14 }}>Номер телефона</label>
          <input
            id="site-phone"
            name="site-phone"
            type="tel"
            autoComplete="tel"
            value={form.phone || ''}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="+373 69 716 541"
          />

          <label htmlFor="site-url" style={{ marginTop: 14 }}>Ссылка на сайт</label>
          <p className="theme-picker-hint" style={{ marginTop: 0 }}>
            Используется в кнопке «Поделиться сайтом», в QR-коде и в ссылках на
            отдельные карточки товара.
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
          {saved && !error && <div className="settings-saved-hint">Настройки сохранены ✓</div>}

          <div className="admin-form-actions">
            <button className="save" onClick={handleSave} disabled={saving}>
              {saving ? 'Сохраняем…' : 'Сохранить'}
            </button>
            <button className="cancel" onClick={onClose} disabled={saving}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  )
}
