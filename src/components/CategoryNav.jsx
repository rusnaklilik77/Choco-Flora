import { getGroupName } from '../data/categories'

// Кнопки-группы на главном экране (Шоколад / Фрукты / Алкоголь …).
// Список групп приходит из базы и редактируется админом в
// Админка → Группы; первая в списке — главная.
export default function CategoryNav({ groups, active, onChange, lang, t }) {
  if (!groups.length) return null
  return (
    <nav className="category-nav" aria-label={t?.categoryNavLabel || 'Группы меню'}>
      <div className="category-nav-track">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`category-btn ${active === g.id ? 'active' : ''}`}
            onClick={() => onChange(g.id)}
          >
            <span className="category-btn-emoji">{g.emoji}</span>
            <span className="category-btn-label">{getGroupName(g, lang)}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
