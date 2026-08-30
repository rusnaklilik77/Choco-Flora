import { useState } from 'react'
import ThemeSwatchGrid from './ThemeSwatchGrid'
import { emptyCustomTheme, THEME_CATEGORIES } from '../themes'
import { deriveThemeColors } from '../utils/colorTools'
import { toDirectImageUrl, toDirectImageUrls, isGoogleDriveLink } from '../utils/driveTools'

const MAX_STICKERS = 5

export default function AdminThemesPanel({
  themes, currentThemeId, onSelectTheme,
  onAddTheme, onUpdateTheme, onDeleteTheme, onClose,
}) {
  const [themeForm, setThemeForm] = useState(null) // null = форма закрыта
  const [themeSaving, setThemeSaving] = useState(false)
  const [themeError, setThemeError] = useState('')

  const startCreateTheme = () => {
    setThemeError('')
    const base = emptyCustomTheme()
    setThemeForm({
      ...base,
      mascotEmoji: base.mascotItems?.[0]?.emoji || '',
      mascotImage: '',
    })
  }

  const startEditTheme = (theme) => {
    setThemeError('')
    setThemeForm({
      ...theme,
      particleImages: [...(theme.particleImages || [])],
      mascotEmoji: theme.mascotItems?.[0]?.image ? '' : (theme.mascotItems?.[0]?.emoji || ''),
      mascotImage: theme.mascotItems?.[0]?.image || '',
    })
  }

  const cancelThemeForm = () => {
    setThemeForm(null)
    setThemeError('')
  }

  const setBgImageUrl = (value) => {
    setThemeForm((f) => ({ ...f, bgImage: value }))
  }

  const removeBgImage = () => {
    setThemeForm((f) => ({ ...f, bgImage: null }))
  }

  const setStickerUrl = (index, value) => {
    setThemeForm((f) => {
      const next = [...(f.particleImages || [])]
      next[index] = value
      return { ...f, particleImages: next }
    })
  }

  const removeSticker = (index) => {
    setThemeForm((f) => {
      const next = [...(f.particleImages || [])]
      next.splice(index, 1)
      return { ...f, particleImages: next }
    })
  }

  const addStickerSlot = () => {
    setThemeForm((f) => ({
      ...f,
      particleImages: [...(f.particleImages || []), ''],
    }))
  }

  const handleAccentChange = (e) => {
    const accent = e.target.value
    setThemeForm((f) => ({ ...f, colors: { ...f.colors, ...deriveThemeColors(accent) } }))
  }

  const handleCategoryChange = (e) => {
    setThemeForm((f) => ({ ...f, category: e.target.value }))
  }

  const handleMascotEmojiChange = (e) => {
    const emoji = e.target.value
    setThemeForm((f) => ({ ...f, mascotEmoji: emoji, emoji: emoji || f.emoji }))
  }

  const handleMascotImageChange = (value) => {
    setThemeForm((f) => ({ ...f, mascotImage: value }))
  }

  const removeMascotImage = () => handleMascotImageChange('')

  const saveThemeForm = async () => {
    if (!themeForm.name.trim()) {
      setThemeError('Введите название темы')
      return
    }

    setThemeSaving(true)
    setThemeError('')
    try {
      const mascotImage = themeForm.mascotImage?.trim()
      const mascotEmoji = themeForm.mascotEmoji?.trim()
      // Если задано и то, и другое — картинка по ссылке важнее эмодзи.
      const mascotItems = mascotImage
        ? [{ image: toDirectImageUrl(mascotImage), size: 1 }]
        : mascotEmoji
          ? [{ emoji: mascotEmoji, size: 1 }]
          : []

      const { mascotEmoji: _dropEmoji, mascotImage: _dropImage, ...restForm } = themeForm
      const themeToSave = {
        ...restForm,
        name: themeForm.name.trim(),
        bgImage: themeForm.bgImage ? toDirectImageUrl(themeForm.bgImage) : null,
        particleImages: toDirectImageUrls(themeForm.particleImages || []),
        mascotItems,
      }
      if (themeForm.id) {
        await onUpdateTheme(themeForm.id, themeToSave)
      } else {
        await onAddTheme(themeToSave)
      }
      setThemeForm(null)
    } catch (err) {
      console.error('[choco-flora] Не удалось сохранить тему:', err)
      setThemeError('Не удалось сохранить тему. Проверьте интернет-соединение и попробуйте ещё раз. (Форма не закрыта, введённые данные не потеряны.)')
    } finally {
      setThemeSaving(false)
    }
  }

  const deleteThemeHandler = async (theme) => {
    if (themes.length <= 1) {
      alert('Нельзя удалить последнюю оставшуюся тему сайта — сначала создайте другую.')
      return
    }
    if (confirm(`Удалить тему «${theme.name}»?`)) {
      try {
        await onDeleteTheme(theme.id)
      } catch (err) {
        console.error('[choco-flora] Не удалось удалить тему:', err)
        alert('Не удалось удалить тему. Проверьте интернет-соединение и попробуйте ещё раз.')
      }
    }
  }

  const stickerList = themeForm ? (themeForm.particleImages || []) : []

  return (
    <div className="admin-panel-overlay nested" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="admin-panel-header">
          <h2>🎨 Темы</h2>
          <button onClick={onClose} aria-label="Закрыть">✕</button>
        </div>

        <ThemeSwatchGrid themes={themes} currentId={currentThemeId} onSelect={onSelectTheme} />

        <div className="theme-manage-section">
          <h3 style={{ marginTop: 0 }}>Управление темами</h3>
          <p className="theme-picker-hint">
            Можно редактировать и удалять абсолютно любую тему — и готовые, и свои.
            Фон и падающие картинки задаются ссылкой (например, на файл с Google Диска —
            он должен быть открыт «для всех, у кого есть ссылка»).
          </p>

          {!themeForm && (
            <div style={{ marginBottom: 12 }}>
              {themes.map((t) => (
                <div className="admin-item-row" key={t.id}>
                  {t.bgImage ? (
                    <img src={t.bgImage} alt={t.name} referrerPolicy="no-referrer" />
                  ) : (
                    <div
                      className="theme-row-swatch"
                      style={{ background: `linear-gradient(135deg, ${t.colors.bgTo}, ${t.colors.bgFrom})` }}
                    />
                  )}
                  <div className="admin-item-info">
                    <strong>{t.emoji} {t.name}</strong>
                    <span>{(t.particleImages || []).length} картинок · {t.category}</span>
                  </div>
                  <div className="admin-item-actions">
                    <button onClick={() => startEditTheme(t)} title="Редактировать">✏️</button>
                    <button onClick={() => deleteThemeHandler(t)} title="Удалить">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!themeForm && (
            <button className="admin-add-btn" onClick={startCreateTheme}>
              ＋ Создать тему
            </button>
          )}

          {themeForm && (
            <div className="admin-form">
              <label>Название темы</label>
              <input
                value={themeForm.name}
                onChange={(e) => setThemeForm({ ...themeForm, name: e.target.value })}
                placeholder="Например: Мой день рождения"
              />

              <label>Категория (в каком разделе показывать тему)</label>
              <select value={themeForm.category || 'custom'} onChange={handleCategoryChange} className="admin-select">
                {THEME_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>

              <label>Ссылка на фон темы (Google Диск или любое фото-хранилище)</label>
              {themeForm.bgImage ? (
                <div className="theme-bg-preview">
                  <img src={toDirectImageUrl(themeForm.bgImage)} alt="Фон темы" referrerPolicy="no-referrer" />
                  <button type="button" className="remove-x" onClick={removeBgImage}>✕</button>
                </div>
              ) : null}
              <input
                value={themeForm.bgImage || ''}
                onChange={(e) => setBgImageUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
              />
              {themeForm.bgImage && isGoogleDriveLink(themeForm.bgImage) && (
                <span className="link-hint">Ссылка с Google Диска — конвертируется в прямую автоматически.</span>
              )}

              <label style={{ marginTop: 14 }}>
                Падающие картинки-стикеры (ссылки, лучше PNG с прозрачным фоном)
              </label>
              <div className="link-list">
                {stickerList.map((url, i) => (
                  <div className="link-item" key={i}>
                    {url ? (
                      <img className="link-item-preview" src={toDirectImageUrl(url)} alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="link-item-preview link-item-preview-empty">🖼️</div>
                    )}
                    <input
                      value={url}
                      onChange={(e) => setStickerUrl(i, e.target.value)}
                      placeholder="Ссылка на картинку"
                    />
                    <button type="button" className="remove-x-inline" onClick={() => removeSticker(i)}>✕</button>
                  </div>
                ))}
                {stickerList.length < MAX_STICKERS && (
                  <button type="button" className="admin-add-btn admin-add-btn-small" onClick={addStickerSlot}>
                    ＋ Добавить картинку
                  </button>
                )}
              </div>

              <label>Цвет темы</label>
              <div className="color-picker-row">
                <input
                  type="color"
                  value={themeForm.colors.accent}
                  onChange={handleAccentChange}
                />
                <span className="color-picker-hint">
                  Остальные оттенки (фон, карточки, текст) подберутся автоматически
                </span>
              </div>

              <label style={{ marginTop: 14 }}>
                Фигурка-талисман (стоит в правом нижнем углу экрана и покачивается)
              </label>
              <p className="theme-picker-hint" style={{ marginTop: 0 }}>
                Можно задать эмодзи ИЛИ ссылку на картинку (например, PNG с прозрачным фоном
                с Google Диска) — если заполнить оба поля, используется картинка по ссылке.
              </p>
              <div className="color-picker-row">
                <input
                  className="mascot-emoji-input"
                  value={themeForm.mascotEmoji || ''}
                  onChange={handleMascotEmojiChange}
                  maxLength={4}
                  placeholder="🎨"
                  style={{ width: 64, fontSize: 24, textAlign: 'center' }}
                />
                <span className="color-picker-hint">Вариант 1: эмодзи</span>
              </div>

              {themeForm.mascotImage ? (
                <div className="theme-bg-preview">
                  <img src={toDirectImageUrl(themeForm.mascotImage)} alt="Фигурка-талисман" referrerPolicy="no-referrer" />
                  <button type="button" className="remove-x" onClick={removeMascotImage}>✕</button>
                </div>
              ) : null}
              <input
                value={themeForm.mascotImage || ''}
                onChange={(e) => handleMascotImageChange(e.target.value)}
                placeholder="Вариант 2: ссылка на картинку — https://drive.google.com/file/d/.../view?usp=sharing"
              />
              {themeForm.mascotImage && isGoogleDriveLink(themeForm.mascotImage) && (
                <span className="link-hint">Ссылка с Google Диска — конвертируется в прямую автоматически.</span>
              )}

              {themeError && <div className="admin-login-error">{themeError}</div>}

              <div className="admin-form-actions">
                <button className="save" onClick={saveThemeForm} disabled={themeSaving}>
                  {themeSaving ? 'Сохраняем…' : 'Сохранить тему'}
                </button>
                <button className="cancel" onClick={cancelThemeForm} disabled={themeSaving}>Отмена</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
