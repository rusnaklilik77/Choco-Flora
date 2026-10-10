import { THEME_CATEGORIES } from '../themes'
import { useAdminT } from '../adminI18n'

export default function ThemeSwatchGrid({ themes, currentId, onSelect }) {
  const { t: tr } = useAdminT()
  return (
    <div className="theme-picker-section">
      <h3>{tr('themePickerTitle')}</h3>
      <p className="theme-picker-hint">
        {tr('themePickerHint')}
      </p>

      {THEME_CATEGORIES.map((cat) => {
        const themesInCat = themes.filter((t) => t.category === cat.id)
        if (!themesInCat.length) return null
        return (
          <div key={cat.id}>
            <div className="theme-category-label">{tr('themeCats')[cat.id] || cat.label}</div>
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
