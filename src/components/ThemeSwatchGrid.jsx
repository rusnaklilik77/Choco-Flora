import { THEME_CATEGORIES } from '../themes'

export default function ThemeSwatchGrid({ themes, currentId, onSelect }) {
  return (
    <div className="theme-picker-section">
      <h3>Тема сайта</h3>
      <p className="theme-picker-hint">
        Тема видна всем посетителям сайта. Менять её может только админ.
      </p>

      {THEME_CATEGORIES.map((cat) => {
        const themesInCat = themes.filter((t) => t.category === cat.id)
        if (!themesInCat.length) return null
        return (
          <div key={cat.id}>
            <div className="theme-category-label">{cat.label}</div>
            <div className="theme-grid">
              {themesInCat.map((t) => (
                <div
                  key={t.id}
                  className={`theme-swatch ${t.id === currentId ? 'active' : ''}`}
                  onClick={() => onSelect(t.id)}
                >
                  <div
                    className="theme-swatch-preview"
                    style={
                      t.bgImage
                        ? { backgroundImage: `url(${t.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : { background: `linear-gradient(135deg, ${t.colors.bgTo}, ${t.colors.bgFrom})` }
                    }
                  />
                  <span className="emoji">{t.emoji}</span>
                  <span className="label">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
