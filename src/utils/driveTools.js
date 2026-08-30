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
