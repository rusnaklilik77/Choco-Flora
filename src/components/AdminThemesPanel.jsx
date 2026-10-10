import { useState } from 'react'
import ThemeSwatchGrid from './ThemeSwatchGrid'
import { emptyCustomTheme, THEME_CATEGORIES } from '../themes'
import { deriveThemeColors } from '../utils/colorTools'
import { useAdminT } from '../adminI18n'
import {
  toDirectImageUrl, toDirectImageUrls, toDirectVideoUrl,
  isGoogleDriveLink, isGifUrl, getSongKind,
} from '../utils/driveTools'

const MAX_STICKERS = 5

const MASCOT_TYPE_IDS = ['emoji', 'image', 'video']

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
  const { t } = useAdminT()
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
      songUrl: theme.songUrl || '',
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
      setThemeError(t('themeNameRequired'))
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
        songUrl: (themeForm.songUrl || '').trim() || null,
      }

      if (themeForm.id) {
        await onUpdateTheme(themeForm.id, themeToSave)
      } else {
        await onAddTheme(themeToSave)
      }
      setThemeForm(null)
    } catch (err) {
      console.error('[choco-flora] Не удалось сохранить тему:', err)
      setThemeError(t('themeSaveFail'))
    } finally {
      setThemeSaving(false)
    }
  }

  const deleteThemeHandler = async (theme) => {
    if (themes.length <= 1) {
      alert(t('themeLast'))
      return
    }
    if (confirm(t('themeDeleteConfirm', { name: theme.name }))) {
      try {
        await onDeleteTheme(theme.id)
      } catch (err) {
        console.error('[choco-flora] Не удалось удалить тему:', err)
        alert(t('themeDeleteFail'))
      }
    }
  }

  const stickerList = themeForm ? (themeForm.particleImages || []) : []

  return (
    <div className="admin-panel-overlay nested" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="admin-panel-header">
          <h2>{t('themesTitle')}</h2>
          <button onClick={onClose} aria-label={t('close')}>✕</button>
        </div>

        <ThemeSwatchGrid themes={themes} currentId={currentThemeId} onSelect={onSelectTheme} />

        <div className="theme-manage-section">
          <h3 style={{ marginTop: 0 }}>{t('manageThemes')}</h3>
          <p className="theme-picker-hint">
            {t('manageThemesHint')}
          </p>

          {!themeForm && (
            <div style={{ marginBottom: 12 }}>
              {themes.map((th) => (
                <div className="admin-item-row" key={th.id}>
                  {th.bgImage ? (
                    <img src={th.bgImage} alt={th.name} referrerPolicy="no-referrer" />
                  ) : (
                    <div
                      className="theme-row-swatch"
                      style={{ background: `linear-gradient(135deg, ${th.colors.bgTo}, ${th.colors.bgFrom})` }}
                    />
                  )}
                  <div className="admin-item-info">
                    <strong>{th.emoji} {th.name}</strong>
                    <span>
                      {t('themeImages', { n: (th.particleImages || []).length })} · {t('themeCats')[th.category] || th.category}
                      {th.bgVideo ? t('themeVideoBadge') : ''}
                      {th.songUrl ? t('themeSongBadge') : ''}
                    </span>
                  </div>
                  <div className="admin-item-actions">
                    <button onClick={() => startEditTheme(th)} title={t('edit')}>✏️</button>
                    <button onClick={() => deleteThemeHandler(th)} title={t('remove')}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!themeForm && (
            <button className="admin-add-btn" onClick={startCreateTheme}>
              {t('createTheme')}
            </button>
          )}

          {themeForm && (
            <div className="admin-form">
              <label htmlFor="theme-name">{t('themeName')}</label>
              <input
                id="theme-name"
                name="theme-name"
                value={themeForm.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder={t('themeNamePh')}
              />

              <label htmlFor="theme-category">{t('themeCategory')}</label>
              <select
                id="theme-category"
                name="theme-category"
                value={themeForm.category || 'custom'}
                onChange={(e) => patch({ category: e.target.value })}
                className="admin-select"
              >
                {THEME_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{t('themeCats')[c.id] || c.label}</option>
                ))}
              </select>

              <label htmlFor="theme-bg-image">{t('themeBg')}</label>
              {themeForm.bgImage ? (
                <div className="theme-bg-preview">
                  <img src={toDirectImageUrl(themeForm.bgImage)} alt={t('themeBgAlt')} referrerPolicy="no-referrer" />
                  <button type="button" className="remove-x" onClick={() => patch({ bgImage: null })}>✕</button>
                </div>
              ) : null}
              <input
                id="theme-bg-image"
                name="theme-bg-image"
                value={themeForm.bgImage || ''}
                onChange={(e) => patch({ bgImage: e.target.value })}
                placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
              />
              {themeForm.bgImage && isGoogleDriveLink(themeForm.bgImage) && (
                <span className="link-hint">{t('driveHint')}</span>
              )}

              <label htmlFor="theme-bg-video" style={{ marginTop: 14 }}>
                {t('themeBgVideo')}
              </label>
              <p className="theme-picker-hint" style={{ marginTop: 0 }}>
                {t('themeBgVideoHint')}
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
                id="theme-bg-video"
                name="theme-bg-video"
                value={themeForm.bgVideo || ''}
                onChange={(e) => patch({ bgVideo: e.target.value })}
                placeholder={t('themeBgVideoPh')}
              />
              {themeForm.bgVideo && isGoogleDriveLink(themeForm.bgVideo) && (
                <span className="link-hint">{t('driveHint')}</span>
              )}

              <label style={{ marginTop: 14 }}>
                {t('stickers')}
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
                      id={`theme-sticker-${i}`}
                      name={`theme-sticker-${i}`}
                      value={url}
                      onChange={(e) => setStickerUrl(i, e.target.value)}
                      placeholder={t('stickerPh')}
                    />
                    <button type="button" className="remove-x-inline" onClick={() => removeSticker(i)}>✕</button>
                  </div>
                ))}
                {stickerList.length < MAX_STICKERS && (
                  <button type="button" className="admin-add-btn admin-add-btn-small" onClick={addStickerSlot}>
                    {t('addSticker')}
                  </button>
                )}
              </div>

              <label htmlFor="theme-particle-size" style={{ marginTop: 14 }}>{t('particleSize')}</label>
              <div className="range-row">
                <input
                  type="range"
                  id="theme-particle-size"
                  name="theme-particle-size"
                  min="0.4"
                  max="2.5"
                  step="0.1"
                  value={themeForm.particleSize ?? 1}
                  onChange={(e) => patch({ particleSize: Number(e.target.value) })}
                />
                <span className="range-value">×{Number(themeForm.particleSize ?? 1).toFixed(1)}</span>
              </div>

              <label htmlFor="theme-accent-color">{t('themeColor')}</label>
              <div className="color-picker-row">
                <input type="color" id="theme-accent-color" name="theme-accent-color" value={themeForm.colors.accent} onChange={handleAccentChange} />
                <span className="color-picker-hint">
                  {t('themeColorHint')}
                </span>
              </div>

              <label htmlFor="theme-mascot-type" style={{ marginTop: 14 }}>
                {t('mascot')}
              </label>
              <p className="theme-picker-hint" style={{ marginTop: 0 }}>
                {t('mascotHint')}
              </p>
              <select
                id="theme-mascot-type"
                name="theme-mascot-type"
                className="admin-select"
                value={themeForm.mascotType || 'emoji'}
                onChange={(e) => patch({ mascotType: e.target.value })}
              >
                {MASCOT_TYPE_IDS.map((id) => (
                  <option key={id} value={id}>{t('mascotTypes')[id]}</option>
                ))}
              </select>

              {themeForm.mascotType === 'emoji' && (
                <div className="color-picker-row" style={{ marginTop: 10 }}>
                  <input
                    id="theme-mascot-emoji"
                    name="theme-mascot-emoji"
                    className="mascot-emoji-input"
                    value={themeForm.mascotEmoji || ''}
                    onChange={(e) => patch({ mascotEmoji: e.target.value })}
                    maxLength={4}
                    placeholder="🎨"
                    style={{ width: 64, fontSize: 24, textAlign: 'center' }}
                  />
                  <span className="color-picker-hint">{t('mascotEmojiHint')}</span>
                </div>
              )}

              {themeForm.mascotType === 'image' && (
                <>
                  {themeForm.mascotImage ? (
                    <div className="theme-bg-preview mascot-preview">
                      <img src={toDirectImageUrl(themeForm.mascotImage)} alt={t('mascotAlt')} referrerPolicy="no-referrer" />
                      <button type="button" className="remove-x" onClick={() => patch({ mascotImage: '' })}>✕</button>
                    </div>
                  ) : null}
                  <input
                    id="theme-mascot-image"
                    name="theme-mascot-image"
                    value={themeForm.mascotImage || ''}
                    onChange={(e) => patch({ mascotImage: e.target.value })}
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                  />
                  {themeForm.mascotImage && isGoogleDriveLink(themeForm.mascotImage) && (
                    <span className="link-hint">{t('driveHint')}</span>
                  )}
                </>
              )}

              {themeForm.mascotType === 'video' && (
                <>
                  {themeForm.mascotVideo ? (
                    <div className="theme-bg-preview mascot-preview">
                      {isGifUrl(themeForm.mascotVideo) ? (
                        <img src={toDirectVideoUrl(themeForm.mascotVideo)} alt={t('mascotAnimAlt')} referrerPolicy="no-referrer" />
                      ) : (
                        <video src={toDirectVideoUrl(themeForm.mascotVideo)} autoPlay loop muted playsInline />
                      )}
                      <button type="button" className="remove-x" onClick={() => patch({ mascotVideo: '' })}>✕</button>
                    </div>
                  ) : null}
                  <input
                    id="theme-mascot-video"
                    name="theme-mascot-video"
                    value={themeForm.mascotVideo || ''}
                    onChange={(e) => patch({ mascotVideo: e.target.value })}
                    placeholder={t('mascotVideoPh')}
                  />
                  {themeForm.mascotVideo && isGoogleDriveLink(themeForm.mascotVideo) && (
                    <span className="link-hint">{t('driveHint')}</span>
                  )}
                </>
              )}

              <label htmlFor="theme-mascot-size" style={{ marginTop: 14 }}>{t('mascotSize')}</label>
              <div className="range-row">
                <input
                  type="range"
                  id="theme-mascot-size"
                  name="theme-mascot-size"
                  min="0.4"
                  max="3"
                  step="0.1"
                  value={themeForm.mascotSize ?? 1}
                  onChange={(e) => patch({ mascotSize: Number(e.target.value) })}
                />
                <span className="range-value">×{Number(themeForm.mascotSize ?? 1).toFixed(1)}</span>
              </div>

              <label htmlFor="theme-song-url" style={{ marginTop: 14 }}>
                {t('songLabel')}
              </label>
              <p className="theme-picker-hint" style={{ marginTop: 0 }}>
                {t('songHint1')}
                <br />
                {t('songHint2')}
              </p>
              <input
                id="theme-song-url"
                name="theme-song-url"
                value={themeForm.songUrl || ''}
                onChange={(e) => patch({ songUrl: e.target.value })}
                placeholder={t('songPh')}
              />
              {themeForm.songUrl && (
                <span className="link-hint">
                  {getSongKind(themeForm.songUrl) === 'youtube' ? t('songYoutube') : t('songAudio')}
                </span>
              )}

              {themeError && <div className="admin-login-error">{themeError}</div>}

              <div className="admin-form-actions">
                <button className="save" onClick={saveThemeForm} disabled={themeSaving}>
                  {themeSaving ? t('saving') : t('saveTheme')}
                </button>
                <button className="cancel" onClick={cancelThemeForm} disabled={themeSaving}>{t('cancel')}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
