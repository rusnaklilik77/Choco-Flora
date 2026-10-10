import { useState } from 'react'
import { useAdminT } from '../adminI18n'

// Окно «Фильтры» (только админ): добавить новый фильтр и удалить
// существующий. Открывается из окна выбора фильтров («Управлять»), из
// формы товара («Управлять фильтрами») и из вкладки «Фильтры» админки.
export default function FilterManagerModal({ filters, usage, onAdd, onDelete, onClose }) {
  const { t } = useAdminT()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async (e) => {
    e?.preventDefault()
    const value = name.trim()
    if (!value) return
    if (filters.some((f) => f.name.trim().toLowerCase() === value.toLowerCase())) {
      setError(t('filterExists'))
      return
    }
    setBusy(true)
    setError('')
    try {
      await onAdd(value)
      setName('')
    } catch (err) {
      console.error('[choco-flora] Не удалось добавить фильтр:', err)
      setError(t('filterSaveFail'))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (f) => {
    if (!confirm(t('filterDeleteConfirm', { name: f.name }))) return
    setBusy(true)
    setError('')
    try {
      await onDelete(f.id)
    } catch (err) {
      console.error('[choco-flora] Не удалось удалить фильтр:', err)
      setError(t('filterSaveFail'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fx-overlay fx-overlay-top" onClick={onClose}>
      <div className="fx-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="fx-head">
          <h3>{t('filtersTitle')}</h3>
          <button type="button" className="fx-close" onClick={onClose} aria-label={t('close')}>✕</button>
        </div>

        <form className="fx-add-row" onSubmit={add}>
          <input
            id="filter-new-name"
            name="filter-new-name"
            value={name}
            onChange={(e) => { setName(e.target.value); setError('') }}
            placeholder={t('newFilterPh')}
            autoComplete="off"
          />
          <button type="submit" className="fx-btn primary" disabled={busy || !name.trim()}>
            {t('addFilter')}
          </button>
        </form>
        {error && <div className="fx-error">{error}</div>}

        <div className="fx-list">
          {filters.map((f) => (
            <div className="fx-row" key={f.id}>
              <span className="fx-row-name">
                {f.name} <em>· {usage[f.id] || 0}</em>
              </span>
              <button type="button" className="fx-btn danger" onClick={() => remove(f)} disabled={busy}>
                {t('deleteFilter')}
              </button>
            </div>
          ))}
          {!filters.length && <p className="fx-empty">{t('filtersEmpty')}</p>}
        </div>
      </div>
    </div>
  )
}
