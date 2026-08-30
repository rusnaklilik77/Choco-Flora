export default function MenuGrid({ items, onSelect, emptyText }) {
  if (!items.length) {
    return (
      <div className="empty-menu">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="menu-grid">
      {items.map((item) => (
        <div className="menu-card" key={item.id} onClick={() => onSelect(item)}>
          <img
            className="menu-card-photo"
            src={item.photos?.[0] || 'https://picsum.photos/seed/choco/400/300'}
            alt={item.name}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="menu-card-body">
            <h3>{item.name}</h3>
            <div className="menu-card-price">{item.price}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
