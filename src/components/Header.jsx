import LanguageSwitcher from './LanguageSwitcher'

export default function Header({ isAdmin, onLogoClick, t, lang, onChangeLang, siteName, logoUrl }) {
  const name = siteName || 'Choco-Flora'
  const dashIndex = name.indexOf('-')

  return (
    <header className="site-header">
      <button
        className="logo-button"
        onClick={onLogoClick}
        aria-label={name}
        title=""
      >
        <img src={logoUrl || '/logo.png'} alt={`${name} logo`} referrerPolicy="no-referrer" />
      </button>
      <h1 className="site-title">
        {dashIndex === -1 ? (
          name
        ) : (
          <>
            {name.slice(0, dashIndex)}
            <span className="accent">-</span>
            {name.slice(dashIndex + 1)}
          </>
        )}
      </h1>
      <p className="site-subtitle">{t.subtitle}</p>

      <LanguageSwitcher lang={lang} onChange={onChangeLang} />

      {isAdmin && (
        <button className="admin-badge" onClick={onLogoClick}>
          {t.adminBadge}
        </button>
      )}
    </header>
  )
}
