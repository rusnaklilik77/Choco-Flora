import { useMemo } from 'react'
import { getPatternBackground } from '../patternShapes'

export default function ThemeBackdrop({ theme }) {
  const patternStyle = useMemo(() => {
    if (theme.bgVideo || theme.bgImage || !theme.pattern) return null
    const bg = getPatternBackground(theme.pattern, theme.colors.accent2, 0.16)
    return { backgroundImage: bg }
  }, [theme.pattern, theme.colors.accent2, theme.bgImage, theme.bgVideo])

  // 1) Видео-фон темы — приоритетнее фото: короткий ролик проигрывается
  //    по кругу, без звука, и растягивается на весь экран.
  if (theme.bgVideo) {
    return (
      <div className="theme-backdrop theme-backdrop-photo" aria-hidden="true">
        <video
          key={theme.bgVideo}
          className="video-bg-layer"
          src={theme.bgVideo}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={theme.bgImage || undefined}
        />
        <div className="vignette-overlay" />
      </div>
    )
  }

  // 2) Тема с фотографией фона
  if (theme.bgImage) {
    return (
      <div className="theme-backdrop theme-backdrop-photo" aria-hidden="true">
        <div
          className="photo-bg-layer"
          style={{ backgroundImage: `url(${theme.bgImage})` }}
        />
        <div className="vignette-overlay" />
      </div>
    )
  }

  // 3) Обычный «живой» градиентный фон с узором темы
  return (
    <div className="theme-backdrop" aria-hidden="true">
      <div className="aurora-blob blob-a" style={{ background: theme.colors.accent }} />
      <div className="aurora-blob blob-b" style={{ background: theme.colors.accent2 }} />
      <div className="aurora-blob blob-c" style={{ background: theme.colors.accent }} />
      {patternStyle && <div className="pattern-overlay" style={patternStyle} />}
      <div className="vignette-overlay" />
    </div>
  )
}
