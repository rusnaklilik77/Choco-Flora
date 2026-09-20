import LanguageSwitcher from './LanguageSwitcher'

export default function Header({
  isAdmin, onLogoClick, t, lang, onChangeLang, siteTitle, titleColor, titleLetterColors, logoUrl,
}) {
  // Массив цветов букв может содержать null — такие буквы остаются
  // в обычной (фирменной) раскраске сайта.
  const letters = Array.isArray(titleLetterColors) && titleLetterColors.some(Boolean)
    ? titleLetterColors
    : null

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
      <h1 className="site-title" style={letters || !titleColor ? undefined : { color: titleColor }}>
        {letters
          ? siteTitle.split('').map((char, i) => (
              <span key={i} style={letters[i] ? { color: letters[i] } : undefined}>
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))
          : siteTitle}
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
