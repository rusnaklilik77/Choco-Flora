import LanguageSwitcher from './LanguageSwitcher'

export default function Header({ isAdmin, onLogoClick, t, lang, onChangeLang }) {
  return (
    <header className="site-header">
      <button
        className="logo-button"
        onClick={onLogoClick}
        aria-label="Choco-Flora"
        title=""
      >
        <img src="/logo.png" alt="Choco-Flora logo" />
      </button>
      <h1 className="site-title">
        Choco<span className="accent">-</span>Flora
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
