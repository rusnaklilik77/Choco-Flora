import { useState } from 'react'
import { toDirectImageUrl, isGoogleDriveLink } from '../utils/driveTools'

export default function AdminSettingsPanel({ settings, onSave, onClose }) {
  const [form, setForm] = useState({ ...settings })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const update = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    setSaved(false)
    setError('')
  }

  const handleSave = async () => {
    if (!form.siteTitle.trim()) {
      setError('Введите название сайта')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        siteTitle: form.siteTitle.trim(),
        titleColor: form.titleColor || '#ffffff',
        logoUrl: toDirectImageUrl(form.logoUrl) || '/logo.png',
        phone: (form.phone || '').trim(),
      })
      setSaved(true)
    } catch (err) {
      console.error('[choco-flora] Не удалось сохранить настройки сайта:', err)
      setError('Не удалось сохранить настройки. Проверьте интернет-соединение и попробуйте ещё раз.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-panel-overlay nested" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="admin-panel-header">
          <h2>⚙️ Настройки сайта</h2>
          <button onClick={onClose} aria-label="Закрыть">✕</button>
        </div>

        <p className="theme-picker-hint" style={{ marginTop: 0 }}>
          Название сайта, его цвет, логотип и телефон видят все посетители сайта.
        </p>

        <div className="admin-form">
          <label>Название сайта</label>
          <input
            value={form.siteTitle}
            onChange={(e) => update({ siteTitle: e.target.value })}
            placeholder="Choco-Flora"
          />

          <label>Цвет названия сайта</label>
          <div className="color-picker-row">
            <input
              type="color"
              value={form.titleColor || '#ffffff'}
              onChange={(e) => update({ titleColor: e.target.value })}
            />
            <span className="color-picker-hint">Этим цветом название будет показано в шапке сайта</span>
          </div>

          <label style={{ marginTop: 14 }}>Логотип (ссылка на картинку)</label>
          {form.logoUrl ? (
            <div className="theme-bg-preview">
              <img src={toDirectImageUrl(form.logoUrl)} alt="Логотип" referrerPolicy="no-referrer" />
            </div>
          ) : null}
          <input
            value={form.logoUrl || ''}
            onChange={(e) => update({ logoUrl: e.target.value })}
            placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
          />
          {form.logoUrl && isGoogleDriveLink(form.logoUrl) && (
            <span className="link-hint">Ссылка с Google Диска — конвертируется в прямую автоматически.</span>
          )}

          <label style={{ marginTop: 14 }}>Телефон для связи</label>
          <input
            value={form.phone || ''}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="+375 60 524 439"
          />

          {error && <div className="admin-login-error">{error}</div>}
          {saved && !error && <div className="settings-saved-hint">Настройки сохранены ✓</div>}

          <div className="admin-form-actions">
            <button className="save" onClick={handleSave} disabled={saving}>
              {saving ? 'Сохраняем…' : 'Сохранить настройки'}
            </button>
            <button className="cancel" onClick={onClose} disabled={saving}>Закрыть</button>
          </div>
        </div>
      </div>
    </div>
  )
}
