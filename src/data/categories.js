// Группы товаров (Шоколад / Фрукты / Алкоголь и т.д.). Это только набор
// значений ПО УМОЛЧАНИЮ — при первом запуске они кладутся в базу
// (settings/catalog), а дальше админ сам добавляет, переименовывает,
// переставляет и удаляет группы в Админка → Группы.
//
// Порядок важен: первая группа в списке — главная (открывается первой).

export const DEFAULT_GROUPS = [
  {
    id: 'choco',
    emoji: '🍫',
    order: 0,
    names: { ru: 'Шоколад', ro: 'Ciocolată', en: 'Choco' },
  },
  {
    id: 'fruits',
    emoji: '🍓',
    order: 1,
    names: { ru: 'Фрукты', ro: 'Fructe', en: 'Fruits' },
  },
  {
    id: 'alco',
    emoji: '🍷',
    order: 2,
    names: { ru: 'Алкоголь', ro: 'Alcool', en: 'Alcohol' },
  },
]

export const DEFAULT_FILTERS = []

export const DEFAULT_CATALOG = {
  groups: DEFAULT_GROUPS,
  filters: DEFAULT_FILTERS,
}

// Товары, сохранённые до появления групп, не имели поля category или
// имели старое значение — для них считаем группой «choco».
export const LEGACY_DEFAULT_GROUP_ID = 'choco'

export const sortGroups = (groups) =>
  [...(groups || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

// Название группы на нужном языке (если перевода нет — русское).
export const getGroupName = (group, lang) =>
  (group?.names?.[lang] || group?.names?.ru || group?.names?.ro || group?.names?.en || '').trim()

export const getItemGroupId = (item) => item?.category || LEGACY_DEFAULT_GROUP_ID

export const makeId = (prefix) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
