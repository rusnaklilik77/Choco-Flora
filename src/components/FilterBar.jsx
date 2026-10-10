// Строка поиска по названию + кнопка «Фильтры» под кнопками-группами.
export default function FilterBar({ query, onQueryChange, activeFiltersCount, onOpenFilters, t }) {
  return (
    <div className="filter-bar">
      <div className="filter-search">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          type="search"
          id="menu-search"
          name="menu-search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          autoComplete="off"
          aria-label={t.searchPlaceholder}
        />
        {query && (
          <button
            type="button"
            className="filter-search-clear"
            onClick={() => onQueryChange('')}
            aria-label={t.clearSearch}
            title={t.clearSearch}
          >
            ✕
          </button>
        )}
      </div>
      <button type="button" className="filter-open-btn" onClick={onOpenFilters}>
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 5h18l-7 8v6l-4-2v-4L3 5z" />
        </svg>
        <span>{t.filtersButton}</span>
        {activeFiltersCount > 0 && <span className="filter-open-badge">{activeFiltersCount}</span>}
      </button>
    </div>
  )
}
