import { CATEGORIES } from '../data/categories'

// Кнопки-разделы на главном экране: переключаются точно так же, как кнопки
// языков RU/RO/EN в шапке сайта. Первая кнопка — «Меню» (показывает всё),
// дальше — Упаковки / Алко / Шоколад / Фрукты, с эмодзи вместо длинных слов.
export default function CategoryNav({ active, onChange, t }) {
  return (
    <nav className="category-nav" aria-label={t?.categoryNavLabel || 'Категории меню'}>
      <div className="category-nav-track">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`category-btn ${active === c.id ? 'active' : ''}`}
            onClick={() => onChange(c.id)}
          >
            <span className="category-btn-emoji">{c.emoji}</span>
            <span className="category-btn-label">{t?.categories?.[c.id] || c.labelRu}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
