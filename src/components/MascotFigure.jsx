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
          className="mascot-item"
          style={{
            fontSize: `${m.size ?? 1}em`,
            animationDelay: `${(m.offset ?? i) * 0.18}s`,
            zIndex: 10 - i,
          }}
        >
          {m.image ? (
            <img className="mascot-item-image" src={m.image} alt="" referrerPolicy="no-referrer" />
          ) : (
            m.emoji
          )}
        </span>
      ))}
    </div>
  )
}
