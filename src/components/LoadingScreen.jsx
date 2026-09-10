export default function LoadingScreen({ hidden, siteTitle = 'Choco-Flora', logoUrl = '/logo.png' }) {
  return (
    <div className={`loading-screen ${hidden ? 'hidden' : ''}`}>
      <div className="loading-wrap">
        <div className="loading-ring" />
        <div className="loading-ring reverse" />
        <img className="loading-logo" src={logoUrl || '/logo.png'} alt={siteTitle} />
        <span className="loading-caption">{siteTitle}</span>
      </div>
    </div>
  )
}
