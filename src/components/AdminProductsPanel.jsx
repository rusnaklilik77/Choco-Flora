import { useState } from 'react'
import { toDirectImageUrls } from '../utils/driveTools'

const emptyForm = { name: '', price: '', composition: '', photosText: '' }

function itemToForm(item) {
  return {
    name: item.name,
    price: item.price,
    composition: item.composition,
    photosText: (item.photos || []).join(', '),
  }
}

function formToItem(form) {
  return {
    name: form.name.trim() || 'Без названия',
    price: form.price.trim() || '—',
    composition: form.composition.trim(),
    photos: toDirectImageUrls(
      form.photosText.split(',').map((s) => s.trim()).filter(Boolean)
    ),
  }
}

export default function AdminProductsPanel({
  menu, onAddItem, onUpdateItem, onDeleteItem, onClose,
}) {
  const [editingId, setEditingId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const startEdit = (item) => {
    setEditingId(item.id)
    setForm(itemToForm(item))
    setCreating(false)
  }

  const startCreate = () => {
    setCreating(true)
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  const cancelForm = () => {
    setEditingId(null)
    setCreating(false)
    setForm(emptyForm)
    setError('')
  }

  const saveForm = async () => {
    setSaving(true)
    setError('')
    try {
      if (creating) {
        await onAddItem(formToItem(form))
      } else if (editingId) {
        await onUpdateItem(editingId, formToItem(form))
      }
      // Форму закрываем только если сохранение реально прошло успешно —
      // иначе введённый текст не должен пропадать.
      cancelForm()
    } catch (err) {
      console.error('[choco-flora] Не удалось сохранить позицию меню:', err)
      setError('Не удалось сохранить позицию. Проверьте интернет-соединение и попробуйте ещё раз.')
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (id) => {
    if (confirm('Удалить эту позицию из меню?')) {
      try {
        await onDeleteItem(id)
      } catch (err) {
        console.error('[choco-flora] Не удалось удалить позицию меню:', err)
        alert('Не удалось удалить позицию. Проверьте интернет-соединение и попробуйте ещё раз.')
      }
    }
  }

  const showForm = creating || editingId

  return (
    <div className="admin-panel-overlay nested" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="admin-panel-header">
          <h2>🍫 Товары</h2>
          <button onClick={onClose} aria-label="Закрыть">✕</button>
        </div>

        {showForm && (
          <div className="admin-form">
            <label>Название</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Например: Chocolate Lava Cake"
            />
            <label>Цена</label>
            <input
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Например: 15 BYN"
            />
            <label>Из чего состоит</label>
            <textarea
              rows={3}
              value={form.composition}
              onChange={(e) => setForm({ ...form, composition: e.target.value })}
              placeholder="Состав / описание блюда"
            />
            <label>Фото (ссылки через запятую — можно с Google Диска)</label>
            <textarea
              rows={2}
              value={form.photosText}
              onChange={(e) => setForm({ ...form, photosText: e.target.value })}
              placeholder="https://drive.google.com/file/d/..., https://..."
            />
            {error && <div className="admin-login-error">{error}</div>}

            <div className="admin-form-actions">
              <button className="save" onClick={saveForm} disabled={saving}>
                {saving ? 'Сохраняем…' : 'Сохранить'}
              </button>
              <button className="cancel" onClick={cancelForm} disabled={saving}>Отмена</button>
            </div>
          </div>
        )}

        {!showForm && (
          <button className="admin-add-btn" onClick={startCreate}>
            ＋ Добавить позицию
          </button>
        )}

        <div style={{ marginTop: 16 }}>
          {menu.map((item) => (
            <div className="admin-item-row" key={item.id}>
              <img
                src={item.photos?.[0] || 'https://picsum.photos/seed/choco/100/100'}
                alt={item.name}
                referrerPolicy="no-referrer"
              />
              <div className="admin-item-info">
                <strong>{item.name}</strong>
                <span>{item.price}</span>
              </div>
              <div className="admin-item-actions">
                <button onClick={() => startEdit(item)} title="Редактировать">✏️</button>
                <button onClick={() => deleteItem(item.id)} title="Удалить">🗑️</button>
              </div>
            </div>
          ))}
          {!menu.length && (
            <p className="theme-picker-hint">Меню пока пустое — добавьте первую позицию.</p>
          )}
        </div>
      </div>
    </div>
  )
}
