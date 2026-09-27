import { useState } from 'react'
import { sanitizeSiteUrl } from '../utils/storage'

// Достаёт из номера телефона только цифры и делает его пригодным для
// ссылки wa.me (WhatsApp), которая принимает номер без пробелов, скобок,
// плюса и дефисов — только код страны и цифры номера подряд.
function toWhatsAppDigits(phone) {
  return (phone || '').replace(/\D/g, '')
}

export default function ProductModal({ item, onClose, t, phone, siteUrl }) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const [copied, setCopied] = useState(false)
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

  // Индивидуальная ссылка на карточку товара — по ней сайт сразу открывает
  // именно эту позицию меню (см. App.jsx, обработка ?item=... в адресе).
  // Базовый адрес берём из настроек сайта (Админка → Настройки → «Ссылка
  // на сайт»), пропуская через sanitizeSiteUrl — если там случайно
  // сохранился localhost/пустая ссылка, вместо неё подставится настоящий
  // публичный адрес сайта, чтобы отправленная клиенту ссылка всегда работала.
  const base = sanitizeSiteUrl(siteUrl).replace(/\/+$/, '')
  const itemUrl = `${base}/?item=${encodeURIComponent(item.id)}`
  const shareText = `${item.name} — ${item.price}`

  const whatsappDigits = toWhatsAppDigits(phone)
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Здравствуйте! Хочу заказать: ${shareText}\n${itemUrl}`)}`
    : null

  const handleShare = async (e) => {
    e.stopPropagation()
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: itemUrl })
        return
      } catch {
        // Пользователь отменил системное окно «Поделиться» — просто выходим,
        // не показываем ошибку.
        return
      }
    }
    try {
      await navigator.clipboard.writeText(itemUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Скопируйте ссылку на карточку товара:', itemUrl)
    }
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

          <div className="modal-icon-actions">
            <a className="icon-action-btn call" href={`tel:${phone}`} title={`${t.callButtonPrefix} ${phone}`}>
              <span className="icon-action-emoji">📞</span>
              <span className="icon-action-label">Звонок</span>
            </a>
            {whatsappHref && (
              <a
                className="icon-action-btn whatsapp"
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                title="Написать в WhatsApp"
              >
                <span className="icon-action-emoji">💬</span>
                <span className="icon-action-label">WhatsApp</span>
              </a>
            )}
            <button type="button" className="icon-action-btn share" onClick={handleShare} title="Поделиться карточкой">
              <span className="icon-action-emoji">{copied ? '✅' : '🔗'}</span>
              <span className="icon-action-label">{copied ? 'Готово' : 'Поделиться'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
