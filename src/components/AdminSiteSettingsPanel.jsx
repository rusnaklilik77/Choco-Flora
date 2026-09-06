import { useState } from 'react'
import { toDirectImageUrl, isGoogleDriveLink } from '../utils/driveTools'

export default function AdminSiteSettingsPanel({ settings, onSave, onClose }) {
  const [form, setForm] = useState({
    siteName: settings.siteName || 'Choco-Flora',
    logoUrl: settings.logoUrl || '',
    titleColor: settings.titleColor || '',
    textColor: settings.textColor || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (patch) => setForm((f) => ({ ...f, ...patch }))

  const save = async () => {
    if (!form.siteName.trim()) {
      setError('Введите название сайта')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({
        siteName: form.siteName.trim(),
        logoUrl: form.logoUrl ? toDirectImageUrl(form.logoUrl) : '',
        titleColor: form.titleColor,
        textColor: form.textColor,
      })
      onClose()
    } catch (err) {
      console.error('[choco-flora] Не удалось сохранить настройки сайта:', err)
      setError('Не удалось сохранить настройки. Проверьте интернет-соединение и попробуйте ещё раз.')
    } finally {
      setSaving(false)
    }
  }

  const resetTitleColor = () => update({ titleColor: '' })
  const resetTextColor = () => update({ textColor: '' })

  return (
    <div className="admin-panel-overlay nested" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="admin-panel-header">
          <h2>⚙️ Настройки сайта</h2>
          <button onClick={onClose} aria-label="Закрыть">✕</button>
        </div>

        <p className="theme-picker-hint">
          Название и лого видны на сайте у всех посетителей. Цвета текста здесь —
          это переопределение поверх текущей темы (например, чтобы заголовок или
          текст было лучше видно). Если оставить поле пустым — используется цвет
          из выбранной темы оформления.
        </p>

        <div className="admin-form">
          <label>Название сайта</label>
          <input
            value={form.siteName}
            onChange={(e) => update({ siteName: e.target.value })}
            placeholder="Choco-Flora"
          />

          <label style={{ marginTop: 14 }}>Ссылка на лого (например, с Google Диска)</label>
          {form.logoUrl ? (
            <div className="theme-bg-preview">
              <img src={toDirectImageUrl(form.logoUrl)} alt="Лого" referrerPolicy="no-referrer" />
              <button type="button" className="remove-x" onClick={() => update({ logoUrl: '' })}>✕</button>
            </div>
          ) : (
            <div className="theme-bg-preview">
              <img src="/logo.png" alt="Лого по умолчанию" />
            </div>
          )}
          <input
            value={form.logoUrl}
            onChange={(e) => update({ logoUrl: e.target.value })}
            placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
          />
          {form.logoUrl && isGoogleDriveLink(form.logoUrl) && (
            <span className="link-hint">Ссылка с Google Диска — конвертируется в прямую автоматически.</span>
          )}
          <p className="theme-picker-hint" style={{ marginTop: 4 }}>
            Оставьте поле пустым, чтобы использовать лого по умолчанию (public/logo.png).
          </p>

          <label style={{ marginTop: 14 }}>Цвет заголовка сайта (название вверху страницы)</label>
          <div className="color-picker-row">
            <input
              type="color"
              value={form.titleColor || '#ffffff'}
              onChange={(e) => update({ titleColor: e.target.value })}
            />
            <span className="color-picker-hint">
              {form.titleColor ? 'Свой цвет заголовка' : 'Сейчас: цвет по умолчанию (белый)'}
            </span>
            {form.titleColor && (
              <button type="button" className="remove-x-inline" onClick={resetTitleColor} title="Сбросить">✕</button>
            )}
          </div>

          <label style={{ marginTop: 14 }}>Цвет основного текста сайта</label>
          <div className="color-picker-row">
            <input
              type="color"
              value={form.textColor || '#3a1220'}
              onChange={(e) => update({ textColor: e.target.value })}
            />
            <span className="color-picker-hint">
              {form.textColor ? 'Свой цвет текста' : 'Сейчас: цвет из текущей темы'}
            </span>
            {form.textColor && (
              <button type="button" className="remove-x-inline" onClick={resetTextColor} title="Сбросить">✕</button>
            )}
          </div>

          {error && <div className="admin-login-error">{error}</div>}

          <div className="admin-form-actions">
            <button className="save" onClick={save} disabled={saving}>
              {saving ? 'Сохраняем…' : 'Сохранить'}
            </button>
            <button className="cancel" onClick={onClose} disabled={saving}>Отмена</button>
          </div>
        </div>
      </div>
    </div>
  )
}
