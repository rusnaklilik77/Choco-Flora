import { useMemo } from 'react'

export default function ParticleBackground({ particles, particleImages, themeId }) {
  const useImages = Boolean(particleImages && particleImages.length)
  const source = useImages ? particleImages : particles

  const items = useMemo(() => {
    if (!source || !source.length) return []
    const count = 22
    return Array.from({ length: count }, (_, i) => {
      const value = source[i % source.length]
      const left = Math.random() * 100
      const duration = 9 + Math.random() * 10
      const delay = -(Math.random() * duration)
      const size = 14 + Math.random() * 18
      const drift = (Math.random() - 0.5) * 60
      return { id: `${themeId}-${i}`, value, left, duration, delay, size, drift }
    })
  }, [source, themeId])

  if (!items.length) return null

  return (
    <div className="particle-layer" aria-hidden="true">
      {items.map((p) => (
        <span
          key={p.id}
          className={`particle ${useImages ? 'particle-image' : ''}`}
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            '--drift': `${p.drift}px`,
          }}
        >
          {useImages ? (
            <img
              src={p.value}
              alt=""
              referrerPolicy="no-referrer"
              style={{ width: `${p.size * 1.8}px`, height: `${p.size * 1.8}px` }}
            />
          ) : (
            p.value
          )}
        </span>
      ))}
    </div>
  )
}
