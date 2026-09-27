// Превращает ссылку на файл в Google Диске в прямую ссылку на картинку,
// которую браузер может показать в <img src="..."> или в фоне (background-image).
//
// Как это устроено: обычная ссылка "Поделиться" с Диска (например
// https://drive.google.com/file/d/ФАЙЛ_ID/view?usp=sharing) открывает
// HTML-страницу просмотра, а НЕ саму картинку — такую ссылку нельзя
// напрямую вставить как источник изображения. Эта функция достаёт из
// ссылки ID файла и собирает специальную ссылку вида
// https://drive.google.com/thumbnail?id=ФАЙЛ_ID&sz=w2000, которая отдаёт
// именно картинку и работает как обычная ссылка на изображение.
//
// Если ссылка не с Google Диска — возвращает её без изменений, так что
// сюда же можно вставлять ссылки с любого другого хостинга картинок
// (Яндекс.Диск с прямой ссылкой, imgur, обычный сайт и т.д.).
//
// ВАЖНО: чтобы это сработало, файл на Google Диске должен быть открыт
// для доступа по ссылке — «Доступ по ссылке» → «Все, у кого есть ссылка»
// → «Читатель». Если доступ закрыт, картинка не загрузится ни у кого,
// кроме владельца файла.

const DRIVE_ID_PATTERNS = [
  /\/file\/d\/([a-zA-Z0-9_-]{10,})/, // .../file/d/ID/view
  /[?&]id=([a-zA-Z0-9_-]{10,})/, // ...?id=ID  или  ...&id=ID
  /\/d\/([a-zA-Z0-9_-]{10,})/, // .../d/ID/...
]

export function isGoogleDriveLink(url) {
  return Boolean(url && /drive\.google\.com/.test(url))
}

/** Достаёт ID файла из любой распространённой формы ссылки на Google Диск. */
export function extractDriveFileId(url) {
  if (!url) return null
  for (const pattern of DRIVE_ID_PATTERNS) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/**
 * Готовит ссылку к использованию как источник изображения.
 * Ссылки Google Диска конвертирует в прямую thumbnail-ссылку,
 * остальные возвращает как есть (обрезая пробелы).
 */
export function toDirectImageUrl(url) {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (!isGoogleDriveLink(trimmed)) return trimmed

  // Уже готовая прямая ссылка — не трогаем.
  if (/\/thumbnail\?/.test(trimmed) || /\/uc\?/.test(trimmed)) return trimmed

  const id = extractDriveFileId(trimmed)
  if (!id) return trimmed

  return `https://drive.google.com/thumbnail?id=${id}&sz=w2000`
}

/** То же самое, но для списка ссылок (например, фото товара через запятую). */
export function toDirectImageUrls(urls) {
  return (urls || []).map(toDirectImageUrl).filter(Boolean)
}

// ---------------------------------------------------------------------
// ВИДЕО (видео-фон темы и видео/GIF-фигурка-талисман)
// ---------------------------------------------------------------------
// Для видео thumbnail-ссылка не годится (она отдаёт картинку-превью),
// поэтому ссылку с Google Диска превращаем в ссылку прямого скачивания
// вида https://drive.google.com/uc?export=download&id=ФАЙЛ_ID —
// её браузер умеет проигрывать в теге <video>.
//
// ВАЖНО: файл на Диске тоже должен быть открыт «для всех, у кого есть
// ссылка». Для больших роликов Google может показывать страницу
// подтверждения — поэтому для фона лучше короткий лёгкий файл (до ~15 МБ)
// или свой хостинг/CDN.

/** Похожа ли ссылка на видеофайл (.mp4 / .webm / .ogv / .mov). */
export function isVideoUrl(url) {
  if (!url) return false
  return /\.(mp4|webm|ogv|ogg|mov|m4v)(\?|#|$)/i.test(url.trim())
}

/** Похожа ли ссылка на GIF-анимацию. */
export function isGifUrl(url) {
  if (!url) return false
  return /\.gif(\?|#|$)/i.test(url.trim())
}

/** Готовит ссылку к использованию как источник видео (<video src="...">). */
export function toDirectVideoUrl(url) {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (!isGoogleDriveLink(trimmed)) return trimmed

  // Уже готовая прямая ссылка на скачивание — не трогаем.
  if (/\/uc\?/.test(trimmed)) return trimmed

  const id = extractDriveFileId(trimmed)
  if (!id) return trimmed

  return `https://drive.google.com/uc?export=download&id=${id}`
}

/**
 * Универсальная подготовка ссылки на «живую» картинку: если это видео —
 * отдаём ссылку для <video>, если GIF или обычная картинка — для <img>.
 */
export function toDirectMediaUrl(url, kind) {
  if (kind === 'video') return toDirectVideoUrl(url)
  return toDirectImageUrl(url)
}

// ---------------------------------------------------------------------
// МУЗЫКА ТЕМЫ (YouTube или аудиофайл, например с Google Диска)
// ---------------------------------------------------------------------
// Каждой теме можно назначить ссылку на песню — она начинает играть, как
// только посетитель заходит на сайт (см. MusicPlayer.jsx: сначала тихо, а
// после первого касания/клика — со звуком).

const YOUTUBE_ID_PATTERNS = [
  /youtu\.be\/([a-zA-Z0-9_-]{6,})/, // youtu.be/ID
  /[?&]v=([a-zA-Z0-9_-]{6,})/, // watch?v=ID
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/, // embed/ID
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/, // shorts/ID
]

/** Похожа ли ссылка на ссылку с YouTube. */
export function isYouTubeLink(url) {
  return Boolean(url && /(youtube\.com|youtu\.be)/i.test(url))
}

/** Достаёт ID ролика из любой распространённой формы ссылки на YouTube. */
export function extractYouTubeId(url) {
  if (!url) return null
  for (const pattern of YOUTUBE_ID_PATTERNS) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/**
 * Собирает ссылку для скрытого iframe-плеера YouTube: без рамки управления,
 * с зацикливанием и с включённым JS API (чтобы можно было программно
 * запускать/ставить на паузу/вкл-выкл звук командами через postMessage).
 *
 * Ролик запускается СРАЗУ в приглушённом виде (autoplay=1&mute=1) — это
 * браузеры разрешают без каких-либо действий посетителя. Как только
 * происходит первое касание/клик на странице, MusicPlayer.jsx посылает
 * команду "unMute" — и звук просто включается у уже играющего видео,
 * без повторной загрузки и без риска, что команда "playVideo" придёт
 * раньше, чем плеер успеет подготовиться.
 */
export function toYouTubeEmbedUrl(url) {
  const id = extractYouTubeId(url)
  if (!id) return null
  const params = new URLSearchParams({
    enablejsapi: '1',
    playsinline: '1',
    controls: '0',
    disablekb: '1',
    modestbranding: '1',
    rel: '0',
    iv_load_policy: '3',
    loop: '1',
    playlist: id,
    autoplay: '1',
    mute: '1',
  })
  if (typeof window !== 'undefined' && window.location?.origin) {
    params.set('origin', window.location.origin)
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`
}

/** Готовит ссылку на аудиофайл (например, с Google Диска или Dropbox) для тега <audio>. */
export function toDirectAudioUrl(url) {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''

  // Dropbox: обычная ссылка "Поделиться" (?dl=0) открывает страницу
  // предпросмотра, а не сам файл — меняем на ?dl=1, чтобы получить прямую
  // ссылку на файл, которую можно вставить в <audio src="...">.
  if (/dropbox\.com/.test(trimmed)) {
    if (/[?&]dl=1/.test(trimmed)) return trimmed
    if (/[?&]dl=0/.test(trimmed)) return trimmed.replace(/([?&])dl=0/, '$1dl=1')
    return trimmed + (trimmed.includes('?') ? '&dl=1' : '?dl=1')
  }

  if (!isGoogleDriveLink(trimmed)) return trimmed
  if (/\/uc\?/.test(trimmed)) return trimmed
  const id = extractDriveFileId(trimmed)
  if (!id) return trimmed
  return `https://drive.google.com/uc?export=download&id=${id}`
}

/** 'youtube' | 'audio' | null — как проигрывать ссылку на песню темы. */
export function getSongKind(url) {
  if (!url || !url.trim()) return null
  if (isYouTubeLink(url)) return 'youtube'
  return 'audio'
}
