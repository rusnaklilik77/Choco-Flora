import { useState } from 'react'
import { fmt } from '../i18n'

// Окно «Выберите фильтры»: фишки-фильтры с количеством товаров, кнопки
// «Управлять» (только для админа) / «Сбросить» / «Показать (N)».
// Выбор применяется только по кнопке «Показать».
export default function FilterPickerModal({
  filters, counts, selected, countMatching, isAdmin,
  onApply, onManage, onClose, t,
}) {
  const [draft, setDraft] = useState(selected)

  const toggle = (id) =>
    setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))

  const matchCount = countMatching(draft)

  return (
    <div className="fx-overlay" onClick={onClose}>
      <div className="fx-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="fx-head">
          <h3>{t.filtersTitle}</h3>
          <button type="button" className="fx-close" onClick={onClose} aria-label="✕">✕</button>
        </div>
        <p className="fx-hint">{t.filtersHint}</p>

        {filters.length ? (
          <div className="fx-chips">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`fx-chip ${draft.includes(f.id) ? 'on' : ''}`}
                onClick={() => toggle(f.id)}
                aria-pressed={draft.includes(f.id)}
              >
                {f.name}
                <span className="fx-chip-count">{counts[f.id] || 0}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="fx-empty">{t.filtersNone}</p>
        )}

        <div className="fx-actions">
          {isAdmin && (
            <button type="button" className="fx-btn" onClick={onManage}>{t.filtersManage}</button>
          )}
          <button
            type="button"
            className="fx-btn"
            onClick={() => setDraft([])}
            disabled={!draft.length}
          >
            {t.filtersClear}
          </button>
          <button type="button" className="fx-btn primary" onClick={() => onApply(draft)}>
            {fmt(t.filtersShow, { n: matchCount })}
          </button>
        </div>
      </div>
    </div>
  )
}
