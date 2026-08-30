export default function LoadingScreen({ hidden }) {
  return (
    <div className={`loading-screen ${hidden ? 'hidden' : ''}`}>
      <div className="loading-wrap">
        <div className="loading-ring" />
        <div className="loading-ring reverse" />
        <img className="loading-logo" src="/logo.png" alt="Choco-Flora" />
        <span className="loading-caption">Choco-Flora</span>
      </div>
    </div>
  )
}
