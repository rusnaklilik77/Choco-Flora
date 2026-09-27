import { useEffect, useRef, useState } from 'react'
import { sanitizeSiteUrl } from '../utils/storage'

// Достаёт из номера телефона только цифры и делает его пригодным для
// ссылки wa.me (WhatsApp), которая принимает номер без пробелов, скобок,
// плюса и дефисов — только код страны и цифры номера подряд.
function toWhatsAppDigits(phone) {
  return (phone || '').replace(/\D/g, '')
}

// Минимальная длина вертикального свайпа (в пикселях) по карточке товара,
// чтобы посчитать его переключением на следующий/предыдущий товар —
// свайп вверх открывает следующий товар, вниз — предыдущий (как в лентах
// историй). Работает поверх фотогалереи, которая сама не скроллится по
// вертикали, поэтому не конфликтует со скроллом текста в теле карточки.
const VERTICAL_SWIPE_THRESHOLD = 50

// Минимальная «сила» прокрутки колесом мыши/тачпадом (deltaY), чтобы
// посчитать её переключением товара — так на компьютере пролистывание
// работает не только стрелками ↑/↓, но и жестом на сенсорной панели
// (тачпад тоже шлёт событие wheel, как обычная прокрутка). Пауза между
// переключениями нужна, чтобы один длинный жест не пролистал сразу
// несколько товаров подряд.
const WHEEL_SWIPE_THRESHOLD = 35
const WHEEL_SWIPE_COOLDOWN_MS = 500

export default function ProductModal({
  item, onClose, t, phone, siteUrl,
  onPrev, onNext, hasPrev, hasNext,
}) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const [copied, setCopied] = useState(false)
  const touchStartY = useRef(null)
  const wheelLockedRef = useRef(false)

  // Сбрасываем индекс фото при переходе на другой товар (в т.ч. через
  // навигацию вверх/вниз стрелками/свайпом), иначе может открыться не то
  // фото или несуществующий индекс, если у нового товара фото меньше.
  useEffect(() => {
    setPhotoIndex(0)
  }, [item?.id])

  // Стрелки ↑/↓ на клавиатуре тоже переключают товар (удобно на компьютере).
  useEffect(() => {
    if (!item) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'ArrowUp' && hasPrev) onPrev?.()
      if (e.key === 'ArrowDown' && hasNext) onNext?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [item, hasPrev, hasNext, onPrev, onNext])

  if (!item) return null

  const handleGalleryTouchStart = (e) => {
    touchStartY.current = e.touches?.[0]?.clientY ?? null
  }
  const handleGalleryTouchEnd = (e) => {
    if (touchStartY.current == null) return
    const endY = e.changedTouches?.[0]?.clientY ?? touchStartY.current
    const delta = endY - touchStartY.current
    touchStartY.current = null
    if (Math.abs(delta) < VERTICAL_SWIPE_THRESHOLD) return
    if (delta < 0) {
      // Свайп вверх -> следующий товар
      if (hasNext) onNext?.()
    } else {
      // Свайп вниз -> предыдущий товар
      if (hasPrev) onPrev?.()
    }
  }

  // Прокрутка колесом мыши или жест на тачпаде компьютера — тоже
  // переключает товар (эквивалент свайпа вверх/вниз на телефоне).
  // wheelLockedRef ставит небольшую паузу после переключения, иначе один
  // жест на тачпаде шлёт десятки событий wheel и пролистает сразу много
  // товаров вместо одного.
  const handleWheel = (e) => {
    if (Math.abs(e.deltaY) < WHEEL_SWIPE_THRESHOLD) return
    if (wheelLockedRef.current) return
    if (e.deltaY > 0) {
      // Прокрутка вниз (палец двигается вверх по тачпаду) -> следующий товар
      if (!hasNext) return
      onNext?.()
    } else {
      // Прокрутка вверх -> предыдущий товар
      if (!hasPrev) return
      onPrev?.()
    }
    wheelLockedRef.current = true
    setTimeout(() => { wheelLockedRef.current = false }, WHEEL_SWIPE_COOLDOWN_MS)
  }

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
      <div className="modal-card" onClick={(e) => e.stopPropagation()} onWheel={handleWheel}>
        <button className="modal-close" onClick={onClose} aria-label="Закрыть">✕</button>

        {(hasPrev || hasNext) && (
          <div className="modal-vertical-nav">
            <button
              type="button"
              className="modal-vertical-nav-btn up"
              onClick={(e) => { e.stopPropagation(); onPrev?.() }}
              disabled={!hasPrev}
              aria-label="Предыдущий товар"
              title="Предыдущий товар"
            >
              ▲
            </button>
            <button
              type="button"
              className="modal-vertical-nav-btn down"
              onClick={(e) => { e.stopPropagation(); onNext?.() }}
              disabled={!hasNext}
              aria-label="Следующий товар"
              title="Следующий товар"
            >
              ▼
            </button>
          </div>
        )}

        <div
          className="modal-gallery"
          onTouchStart={handleGalleryTouchStart}
          onTouchEnd={handleGalleryTouchEnd}
        >
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
              <span className="icon-action-emoji">
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                  <path
                    fill="#000"
                    d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.24.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
                  />
                </svg>
              </span>
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
