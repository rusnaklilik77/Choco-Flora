import { useState } from 'react'
import ThemeSwatchGrid from './ThemeSwatchGrid'
import { emptyCustomTheme, THEME_CATEGORIES } from '../themes'
import { deriveThemeColors } from '../utils/colorTools'
import {
  toDirectImageUrl, toDirectImageUrls, toDirectVideoUrl,
  isGoogleDriveLink, isGifUrl,
} from '../utils/driveTools'

const MAX_STICKERS = 5

// Тип фигурки-талисмана: эмодзи, картинка по ссылке или видео/GIF-анимация.
const MASCOT_TYPES = [
  { id: 'emoji', label: 'Эмодзи' },
  { id: 'image', label: 'Картинка (ссылка)' },
  { id: 'video', label: 'Видео / GIF-анимация (ссылка)' },
]

function detectMascotType(mascot) {
  if (!mascot) return 'emoji'
  if (mascot.video) return 'video'
  if (mascot.image) return 'image'
  return 'emoji'
}

export default function AdminThemesPanel({
  themes, currentThemeId, onSelectTheme,
  onAddTheme, onUpdateTheme, onDeleteTheme, onClose,
}) {
  const [themeForm, setThemeForm] = useState(null) // null = форма закрыта
  const [themeSaving, setThemeSaving] = useState(false)
  const [themeError, setThemeError] = useState('')

  const buildForm = (theme) => {
    const mascot = theme.mascotItems?.[0] || {}
    return {
      ...theme,
      particleImages: [...(theme.particleImages || [])],
      bgVideo: theme.bgVideo || '',
      mascotType: detectMascotType(mascot),
      mascotEmoji: mascot.emoji || '',
      mascotImage: mascot.image || '',
      mascotVideo: mascot.video || '',
      mascotSize: mascot.size ?? 1,
      mascotStyle: mascot.style || 'bounce',
      particleSize: theme.particleSize ?? 1,
    }
  }

  const startCreateTheme = () => {
    setThemeError('')
    setThemeForm(buildForm(emptyCustomTheme()))
  }

  const startEditTheme = (theme) => {
    setThemeError('')
    setThemeForm(buildForm(theme))
  }

  const cancelThemeForm = () => {
    setThemeForm(null)
    setThemeError('')
  }

  const patch = (changes) => setThemeForm((f) => ({ ...f, ...changes }))

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
    setThemeForm((f) => ({ ...f, particleImages: [...(f.particleImages || []), ''] }))
  }

  const handleAccentChange = (e) => {
    const accent = e.target.value
    setThemeForm((f) => ({ ...f, colors: { ...f.colors, ...deriveThemeColors(accent) } }))
  }

  const buildMascotItems = (form) => {
    const size = Number(form.mascotSize) > 0 ? Number(form.mascotSize) : 1
    const style = form.mascotStyle === 'swing' ? 'swing' : 'bounce'

    if (form.mascotType === 'video') {
      const video = (form.mascotVideo || '').trim()
      if (!video) return []
      // GIF показываем как картинку, видео — через тег <video>; в обоих
      // случаях ссылку с Google Диска переводим в прямую.
      return [{ video: toDirectVideoUrl(video), size, style }]
    }
    if (form.mascotType === 'image') {
      const image = (form.mascotImage || '').trim()
      if (!image) return []
      return [{ image: toDirectImageUrl(image), size, style }]
    }
    const emoji = (form.mascotEmoji || '').trim()
    if (!emoji) return []
    return [{ emoji, size, style }]
  }

  const saveThemeForm = async () => {
    if (!themeForm.name.trim()) {
      setThemeError('Введите название темы')
      return
    }

    setThemeSaving(true)
    setThemeError('')
    try {
      const mascotItems = buildMascotItems(themeForm)
      const {
        mascotType: _t, mascotEmoji: _e, mascotImage: _i, mascotVideo: _v,
        mascotSize: _s, mascotStyle: _st,
        ...restForm
      } = themeForm

      const themeToSave = {
        ...restForm,
        name: themeForm.name.trim(),
        emoji: (themeForm.mascotEmoji || themeForm.emoji || '🎨').trim() || '🎨',
        bgImage: themeForm.bgImage ? toDirectImageUrl(themeForm.bgImage) : null,
        bgVideo: themeForm.bgVideo ? toDirectVideoUrl(themeForm.bgVideo) : null,
        particleImages: toDirectImageUrls(themeForm.particleImages || []),
        particleSize: Number(themeForm.particleSize) > 0 ? Number(themeForm.particleSize) : 1,
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
                    <span>
                      {(t.particleImages || []).length} картинок · {t.category}
                      {t.bgVideo ? ' · 🎬 видео-фон' : ''}
                    </span>
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
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="Например: Мой день рождения"
              />

              <label>Категория (в каком разделе показывать тему)</label>
              <select
                value={themeForm.category || 'custom'}
                onChange={(e) => patch({ category: e.target.value })}
                className="admin-select"
              >
                {THEME_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>

              <label>Ссылка на фон темы (Google Диск или любое фото-хранилище)</label>
              {themeForm.bgImage ? (
                <div className="theme-bg-preview">
                  <img src={toDirectImageUrl(themeForm.bgImage)} alt="Фон темы" referrerPolicy="no-referrer" />
                  <button type="button" className="remove-x" onClick={() => patch({ bgImage: null })}>✕</button>
                </div>
              ) : null}
              <input
                value={themeForm.bgImage || ''}
                onChange={(e) => patch({ bgImage: e.target.value })}
                placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
              />
              {themeForm.bgImage && isGoogleDriveLink(themeForm.bgImage) && (
                <span className="link-hint">Ссылка с Google Диска — конвертируется в прямую автоматически.</span>
              )}

              <label style={{ marginTop: 14 }}>
                Видео-фон темы вместо фото (ссылка на .mp4/.webm — свой хостинг, CDN или Google Диск)
              </label>
              <p className="theme-picker-hint" style={{ marginTop: 0 }}>
                Если заполнено — фон будет проигрываться как зацикленное видео (без звука)
                вместо фото или узора выше. Видео должно быть лёгким (короткий ролик),
                чтобы быстро загружаться у посетителей.
              </p>
              {themeForm.bgVideo ? (
                <div className="theme-bg-preview">
                  <video
                    src={toDirectVideoUrl(themeForm.bgVideo)}
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                  <button type="button" className="remove-x" onClick={() => patch({ bgVideo: '' })}>✕</button>
                </div>
              ) : null}
              <input
                value={themeForm.bgVideo || ''}
                onChange={(e) => patch({ bgVideo: e.target.value })}
                placeholder="https://.../background.mp4 или ссылка с Google Диска"
              />
              {themeForm.bgVideo && isGoogleDriveLink(themeForm.bgVideo) && (
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

              <label style={{ marginTop: 14 }}>Размер падающих картинок/эмодзи</label>
              <div className="range-row">
                <input
                  type="range"
                  min="0.4"
                  max="2.5"
                  step="0.1"
                  value={themeForm.particleSize ?? 1}
                  onChange={(e) => patch({ particleSize: Number(e.target.value) })}
                />
                <span className="range-value">×{Number(themeForm.particleSize ?? 1).toFixed(1)}</span>
              </div>

              <label>Цвет темы</label>
              <div className="color-picker-row">
                <input type="color" value={themeForm.colors.accent} onChange={handleAccentChange} />
                <span className="color-picker-hint">
                  Остальные оттенки (фон, карточки, текст) подберутся автоматически
                </span>
              </div>

              <label style={{ marginTop: 14 }}>
                Фигурка-талисман (стоит в правом нижнем углу экрана и покачивается)
              </label>
              <p className="theme-picker-hint" style={{ marginTop: 0 }}>
                Выберите тип: эмодзи, картинка по ссылке, или видео/GIF-анимация по ссылке
                (например, с Google Диска) — так можно добавить любую свою анимацию
                (в том числе покадровую или футажную, с любым персонажем — материал должен
                принадлежать вам или быть свободным для использования).
              </p>
              <select
                className="admin-select"
                value={themeForm.mascotType || 'emoji'}
                onChange={(e) => patch({ mascotType: e.target.value })}
              >
                {MASCOT_TYPES.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>

              {themeForm.mascotType === 'emoji' && (
                <div className="color-picker-row" style={{ marginTop: 10 }}>
                  <input
                    className="mascot-emoji-input"
                    value={themeForm.mascotEmoji || ''}
                    onChange={(e) => patch({ mascotEmoji: e.target.value })}
                    maxLength={4}
                    placeholder="🎨"
                    style={{ width: 64, fontSize: 24, textAlign: 'center' }}
                  />
                  <span className="color-picker-hint">Любой эмодзи — он же будет значком темы</span>
                </div>
              )}

              {themeForm.mascotType === 'image' && (
                <>
                  {themeForm.mascotImage ? (
                    <div className="theme-bg-preview mascot-preview">
                      <img src={toDirectImageUrl(themeForm.mascotImage)} alt="Фигурка-талисман" referrerPolicy="no-referrer" />
                      <button type="button" className="remove-x" onClick={() => patch({ mascotImage: '' })}>✕</button>
                    </div>
                  ) : null}
                  <input
                    value={themeForm.mascotImage || ''}
                    onChange={(e) => patch({ mascotImage: e.target.value })}
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  />
                  {themeForm.mascotImage && isGoogleDriveLink(themeForm.mascotImage) && (
                    <span className="link-hint">Ссылка с Google Диска — конвертируется в прямую автоматически.</span>
                  )}
                </>
              )}

              {themeForm.mascotType === 'video' && (
                <>
                  {themeForm.mascotVideo ? (
                    <div className="theme-bg-preview mascot-preview">
                      {isGifUrl(themeForm.mascotVideo) ? (
                        <img src={toDirectVideoUrl(themeForm.mascotVideo)} alt="Анимация талисмана" referrerPolicy="no-referrer" />
                      ) : (
                        <video src={toDirectVideoUrl(themeForm.mascotVideo)} autoPlay loop muted playsInline />
                      )}
                      <button type="button" className="remove-x" onClick={() => patch({ mascotVideo: '' })}>✕</button>
                    </div>
                  ) : null}
                  <input
                    value={themeForm.mascotVideo || ''}
                    onChange={(e) => patch({ mascotVideo: e.target.value })}
                    placeholder="https://.../mascot.mp4, .webm или .gif (можно с Google Диска)"
                  />
                  {themeForm.mascotVideo && isGoogleDriveLink(themeForm.mascotVideo) && (
                    <span className="link-hint">Ссылка с Google Диска — конвертируется в прямую автоматически.</span>
                  )}
                </>
              )}

              <label style={{ marginTop: 14 }}>Размер фигурки-талисмана</label>
              <div className="range-row">
                <input
                  type="range"
                  min="0.4"
                  max="3"
                  step="0.1"
                  value={themeForm.mascotSize ?? 1}
                  onChange={(e) => patch({ mascotSize: Number(e.target.value) })}
                />
                <span className="range-value">×{Number(themeForm.mascotSize ?? 1).toFixed(1)}</span>
              </div>

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
