import { useState } from 'react'
import { useAdminT } from '../adminI18n'
import { getGroupName, getItemGroupId, makeId } from '../data/categories'

const EMOJI_SUGGESTIONS = ['🍫', '🍓', '🍷', '🍰', '🧁', '🍪', '🍩', '🍬', '🥂', '🍾', '🍇', '🍊', '🎁', '📦', '☕', '🍦']

const emptyForm = { id: null, emoji: '🍫', ru: '', ro: '', en: '' }

export default function AdminGroupsPanel({ groups, menu, onSaveGroups, onClose }) {
  const { t, lang } = useAdminT()
  const [form, setForm] = useState(null) // null = форма закрыта
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const countItems = (groupId) => menu.filter((m) => getItemGroupId(m) === groupId).length

  const startCreate = () => { setError(''); setForm({ ...emptyForm }) }
  const startEdit = (g) => {
    setError('')
    setForm({
      id: g.id,
      emoji: g.emoji || '🍫',
      ru: g.names?.ru || '',
      ro: g.names?.ro || '',
      en: g.names?.en || '',
    })
  }
  const cancel = () => { setForm(null); setError('') }

  const persist = async (next) => {
    // Нумеруем order заново подряд — порядок в массиве и есть порядок кнопок.
    await onSaveGroups(next.map((g, i) => ({ ...g, order: i })))
  }

  const save = async () => {
    if (!form.ru.trim()) {
      setError(t('groupNameRequired'))
      return
    }
    setSaving(true)
    setError('')
    try {
      const names = { ru: form.ru.trim(), ro: form.ro.trim(), en: form.en.trim() }
      const emoji = form.emoji.trim() || '📁'
      if (form.id) {
        await persist(groups.map((g) => (g.id === form.id ? { ...g, emoji, names } : g)))
      } else {
        await persist([...groups, { id: makeId('g'), emoji, names, order: groups.length }])
      }
      setForm(null)
    } catch (err) {
      console.error('[choco-flora] Не удалось сохранить группу:', err)
      setError(`${t('groupSaveFail')} ${t('netError')}`)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (g) => {
    const n = countItems(g.id)
    const name = getGroupName(g, lang)
    if (n > 0) {
      alert(t('groupDeleteBlocked', { name, n }))
      return
    }
    if (!confirm(t('groupDeleteConfirm', { name }))) return
    try {
      await persist(groups.filter((x) => x.id !== g.id))
    } catch (err) {
      console.error('[choco-flora] Не удалось удалить группу:', err)
      alert(`${t('groupDeleteFail')} ${t('netError')}`)
    }
  }

  const move = async (index, delta) => {
    const target = index + delta
    if (target < 0 || target >= groups.length) return
    const next = [...groups]
    ;[next[index], next[target]] = [next[target], next[index]]
    try {
      await persist(next)
    } catch (err) {
      console.error('[choco-flora] Не удалось поменять порядок групп:', err)
      alert(`${t('groupSaveFail')} ${t('netError')}`)
    }
  }

  return (
    <div className="admin-panel-overlay nested" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="admin-panel-header">
          <h2>{t('groupsTitle')}</h2>
          <button onClick={onClose} aria-label={t('close')}>✕</button>
        </div>

        <p className="theme-picker-hint" style={{ marginTop: 0 }}>{t('groupsHint')}</p>

        {form && (
          <div className="admin-form">
            <label htmlFor="group-emoji">{t('groupEmoji')}</label>
            <div className="color-picker-row">
              <input
                id="group-emoji"
                name="group-emoji"
                className="mascot-emoji-input"
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                maxLength={4}
                style={{ width: 64, fontSize: 24, textAlign: 'center' }}
              />
            </div>
            <div className="emoji-suggest">
              {EMOJI_SUGGESTIONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  className={form.emoji === em ? 'active' : ''}
                  onClick={() => setForm({ ...form, emoji: em })}
                >
                  {em}
                </button>
              ))}
            </div>

            <label htmlFor="group-name-ru" style={{ marginTop: 14 }}>{t('groupNameRu')}</label>
            <input
              id="group-name-ru"
              name="group-name-ru"
              value={form.ru}
              onChange={(e) => { setForm({ ...form, ru: e.target.value }); setError('') }}
              placeholder="Шоколад"
            />
            <label htmlFor="group-name-ro">{t('groupNameRo')}</label>
            <input
              id="group-name-ro"
              name="group-name-ro"
              value={form.ro}
              onChange={(e) => setForm({ ...form, ro: e.target.value })}
              placeholder="Ciocolată"
            />
            <label htmlFor="group-name-en">{t('groupNameEn')}</label>
            <input
              id="group-name-en"
              name="group-name-en"
              value={form.en}
              onChange={(e) => setForm({ ...form, en: e.target.value })}
              placeholder="Chocolate"
            />
            <p className="theme-picker-hint" style={{ marginTop: 4 }}>{t('groupNamesHint')}</p>

            {error && <div className="admin-login-error">{error}</div>}

            <div className="admin-form-actions">
              <button className="save" onClick={save} disabled={saving}>
                {saving ? t('saving') : t('save')}
              </button>
              <button className="cancel" onClick={cancel} disabled={saving}>{t('cancel')}</button>
            </div>
          </div>
        )}

        {!form && (
          <>
            <div style={{ marginBottom: 12 }}>
              {groups.map((g, i) => (
                <div className="admin-item-row" key={g.id}>
                  <div className="group-row-emoji">{g.emoji}</div>
                  <div className="admin-item-info">
                    <strong>{getGroupName(g, lang)}</strong>
                    <span>
                      {t('groupItems', { n: countItems(g.id) })}
                      {i === 0 ? ` · ⭐ ${t('groupMain')}` : ''}
                    </span>
                  </div>
                  <div className="admin-item-actions">
                    <button onClick={() => move(i, -1)} disabled={i === 0} title={t('moveUp')}>▲</button>
                    <button onClick={() => move(i, 1)} disabled={i === groups.length - 1} title={t('moveDown')}>▼</button>
                    <button onClick={() => startEdit(g)} title={t('edit')}>✏️</button>
                    <button onClick={() => remove(g)} title={t('remove')}>🗑️</button>
                  </div>
                </div>
              ))}
              {!groups.length && <p className="theme-picker-hint">{t('groupsEmpty')}</p>}
            </div>
            <button className="admin-add-btn" onClick={startCreate}>{t('addGroup')}</button>
          </>
        )}
      </div>
    </div>
  )
}
