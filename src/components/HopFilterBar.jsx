import { useId, useState } from 'react';

export default function HopFilterBar({ label, search, quick = [], active, onQuickChange, advanced, advancedActive = false, count, total, onClear, hasFilters = false, children }) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  return <section className={`hop-filter-bar${!search && !advanced ? ' hop-filter-bar--compact' : ''}`} aria-label={label}>
    <div className="hop-filter-bar__top">
      {search && <div className="hop-filter-bar__search">{search}</div>}
      {advanced && <button type="button" className={`hop-filter-bar__toggle${expanded || advancedActive ? ' is-active' : ''}`} aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpanded((value) => !value)}><span aria-hidden="true">☷</span> Filtros{advancedActive ? ' ativos' : ''} <span aria-hidden="true">{expanded ? '⌃' : '⌄'}</span></button>}
      <span className="hop-filter-bar__count" aria-live="polite"><strong>{count}</strong> de {total}</span>
    </div>
    {quick.length > 0 && <div className="hop-filter-bar__quick" role="group" aria-label="Filtros rápidos">{quick.map(([value, text]) => <button type="button" className={`hop-filter-chip${active === value ? ' is-active' : ''}`} aria-pressed={active === value} key={value} onClick={() => onQuickChange(value)}>{text}</button>)}</div>}
    {advanced && <div id={panelId} className="hop-filter-bar__advanced" hidden={!expanded}>{advanced}</div>}
    {(hasFilters || children) && <div className="hop-filter-bar__footer">{children}{hasFilters && <button type="button" className="hop-filter-bar__clear" onClick={onClear}>Limpar filtros</button>}</div>}
  </section>;
}
