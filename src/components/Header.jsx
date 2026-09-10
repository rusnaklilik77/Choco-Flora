import LanguageSwitcher from './LanguageSwitcher'

export default function Header({ isAdmin, onLogoClick, t, lang, onChangeLang, siteTitle, titleColor, logoUrl }) {
  return (
    <header className="site-header">
      <button
        className="logo-button"
        onClick={onLogoClick}
        aria-label={siteTitle}
        title=""
      >
        <img src={logoUrl || '/logo.png'} alt={`${siteTitle} logo`} />
      </button>
      <h1 className="site-title" style={{ color: titleColor }}>
        {siteTitle}
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
