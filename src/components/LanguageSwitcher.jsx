import { LANGUAGES } from '../i18n'

export default function LanguageSwitcher({ lang, onChange }) {
  return (
    <div className="lang-switcher" role="group" aria-label="Язык сайта / Limba site-ului / Site language">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          className={`lang-btn ${l.code === lang ? 'active' : ''}`}
          onClick={() => onChange(l.code)}
          type="button"
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
