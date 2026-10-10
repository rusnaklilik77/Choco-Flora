import { useState } from 'react'
import { toDirectImageUrl, toDirectImageUrls, isGoogleDriveLink } from '../utils/driveTools'
import { useAdminT } from '../adminI18n'
import { getGroupName, getItemGroupId } from '../data/categories'

const MAX_PHOTOS = 5
// Группа НЕ выбирается по умолчанию сама — её нужно выбрать явно, иначе
// новые позиции незаметно копились бы в одном разделе.
const emptyForm = { name: '', price: '', composition: '', photos: [''], category: '', filters: [] }

function itemToForm(item) {
  const photos = (item.photos && item.photos.length ? item.photos : [''])
  return {
    name: item.name,
    price: item.price,
    composition: item.composition,
    photos: photos.slice(0, MAX_PHOTOS),
    category: item.category || '',
    filters: Array.isArray(item.filters) ? [...item.filters] : [],
  }
}

export default function AdminProductsPanel({
  menu, groups, filters, onAddItem, onUpdateItem, onDeleteItem, onManageFilters, onClose,
}) {
  const { t, lang } = useAdminT()
  const [editingId, setEditingId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterGroup, setFilterGroup] = useState('all')

  const groupIds = new Set(groups.map((g) => g.id))
  const isOrphan = (item) => !groupIds.has(getItemGroupId(item))
  const orphanCount = menu.filter(isOrphan).length

  const formToItem = (f) => ({
    name: f.name.trim() || t('untitled'),
    price: f.price.trim() || '—',
    composition: f.composition.trim(),
    photos: toDirectImageUrls(f.photos.map((s) => (s || '').trim()).filter(Boolean)),
    category: f.category,
    // Оставляем только фильтры, которые ещё существуют.
    filters: f.filters.filter((id) => filters.some((x) => x.id === id)),
  })

  const startEdit = (item) => {
    setEditingId(item.id)
    setForm(itemToForm(item))
    setCreating(false)
    setError('')
  }

  const startCreate = () => {
    setCreating(true)
    setEditingId(null)
    // Если сейчас открыта вкладка конкретной группы — подставляем её.
    setForm({ ...emptyForm, category: groupIds.has(filterGroup) ? filterGroup : '' })
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

  const addPhotoSlot = () => setForm((f) => ({ ...f, photos: [...f.photos, ''] }))

  const toggleFilter = (id) =>
    setForm((f) => ({
      ...f,
      filters: f.filters.includes(id) ? f.filters.filter((x) => x !== id) : [...f.filters, id],
    }))

  const saveForm = async () => {
    if (!form.category || !groupIds.has(form.category)) {
      setError(t('productGroupRequired'))
      return
    }
    setSaving(true)
    setError('')
    try {
      if (creating) {
        await onAddItem(formToItem(form))
      } else if (editingId) {
        await onUpdateItem(editingId, formToItem(form))
      }
      cancelForm()
    } catch (err) {
      console.error('[choco-flora] Не удалось сохранить позицию меню:', err)
      setError(`${t('itemSaveFail')} ${t('netError')}`)
    } finally {
      setSaving(false)
    }
  }

  const deleteItem = async (id) => {
    if (confirm(t('itemDeleteConfirm'))) {
      try {
        await onDeleteItem(id)
      } catch (err) {
        console.error('[choco-flora] Не удалось удалить позицию меню:', err)
        alert(`${t('itemDeleteFail')} ${t('netError')}`)
      }
    }
  }

  const showForm = creating || editingId
  const groupOf = (item) => groups.find((g) => g.id === getItemGroupId(item))

  const visibleItems = menu.filter((item) => {
    if (filterGroup === 'all') return true
    if (filterGroup === '__none') return isOrphan(item)
    return getItemGroupId(item) === filterGroup
  })

  return (
    <div className="admin-panel-overlay nested" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="admin-panel-header">
          <h2>{t('productsTitle')}</h2>
          <button onClick={onClose} aria-label={t('close')}>✕</button>
        </div>

        {showForm && (
          <div className="admin-form">
            <label htmlFor="product-name">{t('productName')}</label>
            <input
              id="product-name"
              name="product-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('productNamePh')}
            />
            <label htmlFor="product-price">{t('productPrice')}</label>
            <input
              id="product-price"
              name="product-price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder={t('productPricePh')}
            />
            <label htmlFor="product-composition">{t('productComposition')}</label>
            <textarea
              id="product-composition"
              name="product-composition"
              rows={3}
              value={form.composition}
              onChange={(e) => setForm({ ...form, composition: e.target.value })}
              placeholder={t('productCompositionPh')}
            />

            <label htmlFor="product-category" style={{ marginTop: 14 }}>{t('productGroup')}</label>
            <select
              id="product-category"
              name="product-category"
              className="admin-select"
              value={groupIds.has(form.category) ? form.category : ''}
              onChange={(e) => { setForm({ ...form, category: e.target.value }); setError('') }}
            >
              <option value="" disabled>{t('productGroupChoose')}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.emoji} {getGroupName(g, lang)}</option>
              ))}
            </select>
            {!groups.length && <span className="link-hint">{t('productNoGroups')}</span>}

            <label style={{ marginTop: 14 }}>{t('productFilters')}</label>
            <p className="theme-picker-hint" style={{ marginTop: 0 }}>{t('productFiltersHint')}</p>
            {filters.length ? (
              <div className="admin-filter-chips">
                {filters.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`admin-filter-chip ${form.filters.includes(f.id) ? 'on' : ''}`}
                    onClick={() => toggleFilter(f.id)}
                    aria-pressed={form.filters.includes(f.id)}
                  >
                    {form.filters.includes(f.id) ? '✓ ' : ''}{f.name}
                  </button>
                ))}
              </div>
            ) : (
              <span className="link-hint">{t('productNoFilters')}</span>
            )}
            <button
              type="button"
              className="admin-add-btn admin-add-btn-small"
              style={{ marginTop: 10 }}
              onClick={onManageFilters}
            >
              {t('manageFilters')}
            </button>

            <label style={{ marginTop: 14 }}>{t('photosLabel', { n: MAX_PHOTOS })}</label>
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
                      <span className="link-hint">{t('driveHint')}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="remove-x-inline"
                    onClick={() => removePhoto(i)}
                    title={t('clearLink')}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {form.photos.length < MAX_PHOTOS && (
                <button type="button" className="admin-add-btn admin-add-btn-small" onClick={addPhotoSlot}>
                  {t('addPhoto')}
                </button>
              )}
            </div>

            {error && <div className="admin-login-error">{error}</div>}

            <div className="admin-form-actions">
              <button className="save" onClick={saveForm} disabled={saving}>
                {saving ? t('saving') : t('save')}
              </button>
              <button className="cancel" onClick={cancelForm} disabled={saving}>{t('cancel')}</button>
            </div>
          </div>
        )}

        {!showForm && (
          <button className="admin-add-btn" onClick={startCreate}>
            {t('addItem')}
          </button>
        )}

        {!showForm && menu.length > 0 && (
          <div className="admin-category-tabs">
            <button
              type="button"
              className={`admin-category-tab ${filterGroup === 'all' ? 'active' : ''}`}
              onClick={() => setFilterGroup('all')}
            >
              {t('allGroups')}
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`admin-category-tab ${filterGroup === g.id ? 'active' : ''}`}
                onClick={() => setFilterGroup(g.id)}
              >
                {g.emoji} {getGroupName(g, lang)}
              </button>
            ))}
            {orphanCount > 0 && (
              <button
                type="button"
                className={`admin-category-tab ${filterGroup === '__none' ? 'active' : ''}`}
                onClick={() => setFilterGroup('__none')}
              >
                {t('noGroupTab')} ({orphanCount})
              </button>
            )}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          {visibleItems.map((item) => {
            const g = groupOf(item)
            return (
              <div className="admin-item-row" key={item.id}>
                <img
                  src={item.photos?.[0] || 'https://picsum.photos/seed/choco/100/100'}
                  alt={item.name}
                  referrerPolicy="no-referrer"
                />
                <div className="admin-item-info">
                  <strong>{item.name}</strong>
                  <span>
                    {item.price} · {g ? `${g.emoji} ${getGroupName(g, lang)}` : `⚠️ ${t('noGroupLabel')}`}
                  </span>
                </div>
                <div className="admin-item-actions">
                  <button onClick={() => startEdit(item)} title={t('edit')}>✏️</button>
                  <button onClick={() => deleteItem(item.id)} title={t('remove')}>🗑️</button>
                </div>
              </div>
            )
          })}
          {!menu.length && <p className="theme-picker-hint">{t('menuEmpty')}</p>}
        </div>
      </div>
    </div>
  )
}
