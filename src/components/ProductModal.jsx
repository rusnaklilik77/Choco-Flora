import { useState } from 'react'

const PHONE_NUMBER = '+37360524439'

export default function ProductModal({ item, onClose, t }) {
  const [photoIndex, setPhotoIndex] = useState(0)
  if (!item) return null

  const photos = item.photos?.length ? item.photos : ['https://picsum.photos/seed/choco/600/450']

  const prev = (e) => {
    e.stopPropagation()
    setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)
  }
  const next = (e) => {
    e.stopPropagation()
    setPhotoIndex((i) => (i + 1) % photos.length)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Закрыть">✕</button>

        <div className="modal-gallery">
          <img src={photos[photoIndex]} alt={item.name} referrerPolicy="no-referrer" />
          {photos.length > 1 && (
            <>
              <button className="modal-gallery-nav prev" onClick={prev}>‹</button>
              <button className="modal-gallery-nav next" onClick={next}>›</button>
              <div className="modal-gallery-dots">
                {photos.map((_, i) => (
                  <span
                    key={i}
                    className={i === photoIndex ? 'active' : ''}
                    onClick={(e) => {
                      e.stopPropagation()
                      setPhotoIndex(i)
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="modal-body">
          <h3>{item.name}</h3>
          <div className="modal-price">{item.price}</div>
          <div className="modal-composition-label">{t.compositionLabel}</div>
          <p className="modal-composition">{item.composition}</p>

          <a className="call-button" href={`tel:${PHONE_NUMBER}`}>
            {t.callButtonPrefix} {PHONE_NUMBER}
          </a>
        </div>
      </div>
    </div>
  )
}
