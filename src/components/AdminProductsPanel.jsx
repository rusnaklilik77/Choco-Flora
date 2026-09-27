import { useState } from 'react'
import { toDirectImageUrl, toDirectImageUrls, isGoogleDriveLink } from '../utils/driveTools'
import { CATEGORIES, PRODUCT_CATEGORIES, DEFAULT_PRODUCT_CATEGORY, getCategory } from '../data/categories'

const MAX_PHOTOS = 5
const emptyForm = { name: '', price: '', composition: '', photos: [''], category: DEFAULT_PRODUCT_CATEGORY }

function itemToForm(item) {
  const photos = (item.photos && item.photos.length ? item.photos : [''])
  return {
    name: item.name,
    price: item.price,
    composition: item.composition,
    photos: photos.slice(0, MAX_PHOTOS),
    category: item.category || DEFAULT_PRODUCT_CATEGORY,
  }
}

function formToItem(form) {
  return {
    name: form.name.trim() || 'Без названия',
    price: form.price.trim() || '—',
    composition: form.composition.trim(),
    photos: toDirectImageUrls(form.photos.map((s) => (s || '').trim()).filter(Boolean)),
    category: form.category || DEFAULT_PRODUCT_CATEGORY,
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
  const [filterCat, setFilterCat] = useState('all')

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

  const setPhotoUrl = (index, value) => {
    setForm((f) => {
      const next = [...f.photos]
      next[index] = value
      return { ...f, photos: next }
    })
  }

  const removePhoto = (index) => {
    setForm((f) => {
      const next = [...f.photos]
      next.splice(index, 1)
      if (!next.length) next.push('')
      return { ...f, photos: next }
    })
  }

  const addPhotoSlot = () => {
    setForm((f) => ({ ...f, photos: [...f.photos, ''] }))
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
            <label htmlFor="product-name">Название</label>
            <input
              id="product-name"
              name="product-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Например: Chocolate Lava Cake"
            />
            <label htmlFor="product-price">Цена</label>
            <input
              id="product-price"
              name="product-price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Например: 15 BYN"
            />
            <label htmlFor="product-composition">Из чего состоит</label>
            <textarea
              id="product-composition"
              name="product-composition"
              rows={3}
              value={form.composition}
              onChange={(e) => setForm({ ...form, composition: e.target.value })}
              placeholder="Состав / описание блюда"
            />

            <label htmlFor="product-category" style={{ marginTop: 14 }}>Категория (в каком разделе главного экрана показывать)</label>
            <select
              id="product-category"
              name="product-category"
              className="admin-select"
              value={form.category || DEFAULT_PRODUCT_CATEGORY}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.labelRu}</option>
              ))}
            </select>

            <label style={{ marginTop: 14 }}>
              Фото товара (до {MAX_PHOTOS} шт., ссылка — можно с Google Диска)
            </label>
            <div className="link-list">
              {form.photos.map((url, i) => (
                <div className="link-item" key={i}>
                  {url ? (
                    <img className="link-item-preview" src={toDirectImageUrl(url)} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="link-item-preview link-item-preview-empty">🖼️</div>
                  )}
                  <div style={{ flex: 1 }}>
                    <input
                      id={`product-photo-${i}`}
                      name={`product-photo-${i}`}
                      value={url}
                      onChange={(e) => setPhotoUrl(i, e.target.value)}
                      placeholder="https://drive.google.com/file/d/..."
                    />
                    {url && isGoogleDriveLink(url) && (
                      <span className="link-hint">Ссылка с Google Диска — конвертируется в прямую автоматически.</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="remove-x-inline"
                    onClick={() => removePhoto(i)}
                    title="Стереть ссылку"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {form.photos.length < MAX_PHOTOS && (
                <button type="button" className="admin-add-btn admin-add-btn-small" onClick={addPhotoSlot}>
                  ＋ Добавить фото
                </button>
              )}
            </div>

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

        {!showForm && menu.length > 0 && (
          <div className="admin-category-tabs">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`admin-category-tab ${filterCat === c.id ? 'active' : ''}`}
                onClick={() => setFilterCat(c.id)}
              >
                {c.emoji} {c.labelRu}
              </button>
            ))}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          {menu
            .filter((item) => filterCat === 'all' || (item.category || DEFAULT_PRODUCT_CATEGORY) === filterCat)
            .map((item) => (
            <div className="admin-item-row" key={item.id}>
              <img
                src={item.photos?.[0] || 'https://picsum.photos/seed/choco/100/100'}
                alt={item.name}
                referrerPolicy="no-referrer"
              />
              <div className="admin-item-info">
                <strong>{item.name}</strong>
                <span>{item.price} · {getCategory(item.category || DEFAULT_PRODUCT_CATEGORY).emoji} {getCategory(item.category || DEFAULT_PRODUCT_CATEGORY).labelRu}</span>
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
