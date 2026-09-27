// Категории товаров. Показаны кнопками-вкладками на главном экране сайта
// (переключаются точно так же, как языки RU/RO/EN в шапке) и используются
// в админке — чтобы делить товары по разделам и назначать категорию.
//
// id 'all' — служебный, означает «показать всё меню целиком»: он не
// назначается товарам, а только используется как первая вкладка-фильтр.

export const CATEGORIES = [
  { id: 'all', emoji: '📋', labelRu: 'Меню' },
  { id: 'packaging', emoji: '📦', labelRu: 'Упаковки' },
  { id: 'alco', emoji: '🍷', labelRu: 'Алко' },
  { id: 'choco', emoji: '🍫', labelRu: 'Шоколад' },
  { id: 'fruits', emoji: '🍓', labelRu: 'Фрукты' },
]

// Категории, которые реально можно назначить товару (без служебной "all").
export const PRODUCT_CATEGORIES = CATEGORIES.filter((c) => c.id !== 'all')

export const DEFAULT_PRODUCT_CATEGORY = 'choco'

export const getCategory = (id) => CATEGORIES.find((c) => c.id === id) || PRODUCT_CATEGORIES[0]
