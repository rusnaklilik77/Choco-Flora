export default function LoadingScreen({
  hidden,
  siteTitle = 'Choco-Flora',
  logoUrl = '/logo.png',
  error = null,
  onRetry,
}) {
  return (
    <div className={`loading-screen ${hidden ? 'hidden' : ''}`}>
      <div className="loading-wrap">
        {!error && <div className="loading-ring" />}
        {!error && <div className="loading-ring reverse" />}
        <img className="loading-logo" src={logoUrl || '/logo.png'} alt={siteTitle} />
        {!error && <span className="loading-caption">{siteTitle}</span>}
      </div>
      {error && (
        <div className="loading-error">
          <p>Не удалось загрузить меню. Проверьте интернет и попробуйте ещё раз.</p>
          <button type="button" onClick={onRetry}>Повторить</button>
          <small>Код: {error.code}</small>
        </div>
      )}
    </div>
  )
}
