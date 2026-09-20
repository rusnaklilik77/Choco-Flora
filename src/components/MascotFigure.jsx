import { isGifUrl } from '../utils/driveTools'

// Фигурка-талисман в правом нижнем углу экрана.
// Каждый элемент mascotItems может быть:
//   { emoji: '🍫' }              — обычный эмодзи
//   { image: 'https://...' }     — картинка по ссылке (PNG/JPG)
//   { video: 'https://...' }     — видео (.mp4/.webm) или GIF-анимация
export default function MascotFigure({ mascotItems, themeId, accent }) {
  if (!mascotItems?.length) return null

  const isScene = mascotItems.length > 1

  return (
    <div
      className={`mascot-figure ${isScene ? 'is-scene' : ''}`}
      key={themeId}
      aria-hidden="true"
    >
      <div className="mascot-glow" style={{ background: accent }} />
      {mascotItems.map((m, i) => (
        <span
          key={i}
          className={`mascot-item ${m.style === 'swing' ? 'mascot-item-swing' : ''}`}
          style={{
            fontSize: `${m.size ?? 1}em`,
            animationDelay: `${(m.offset ?? i) * 0.18}s`,
            zIndex: 10 - i,
          }}
        >
          {m.video ? (
            isGifUrl(m.video) ? (
              <img className="mascot-item-image" src={m.video} alt="" referrerPolicy="no-referrer" />
            ) : (
              <video
                className="mascot-item-image"
                src={m.video}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
              />
            )
          ) : m.image ? (
            <img className="mascot-item-image" src={m.image} alt="" referrerPolicy="no-referrer" />
          ) : (
            m.emoji
          )}
        </span>
      ))}
    </div>
  )
}
