import { useState, useRef, useEffect, useId } from 'react';

// Menu déroulant à choix multiple : cases à cocher, « Tout le monde » en un
// clic et recherche par nom. Les personnes choisies s'affichent en
// étiquettes dans le champ. value = tableau d'identifiants.
export default function EmployeeMultiSelect({
  employees, value, onChange, placeholder = 'Choisir…', allLabel = 'Tout le monde', emptyMeansAll = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const listId = useId();

  // Fermeture au clic à côté ou avec Échap
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = new Set(value);
  const allSelected = employees.length > 0 && employees.every((e) => selected.has(e.id));
  const toggle = (id) => onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id]);
  const toggleAll = () => onChange(allSelected ? [] : employees.map((e) => e.id));

  const q = query.trim().toLowerCase();
  // Recherche sur le nom ou le poste (« prépa » trouve les préparateurs)
  const shown = q
    ? employees.filter((e) => `${e.first_name} ${e.last_name} ${e.job_title ?? ''}`.toLowerCase().includes(q))
    : employees;

  const chosen = employees.filter((e) => selected.has(e.id));
  const summary = (emptyMeansAll && chosen.length === 0) || allSelected
    ? allLabel
    : null;

  return (
    <div className="ems" ref={rootRef}>
      <button
        type="button"
        className={`ems-field${open ? ' ems-field--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
      >
        {summary ? (
          <span className="ems-summary">{summary}</span>
        ) : chosen.length === 0 ? (
          <span className="ems-placeholder">{placeholder}</span>
        ) : (
          <span className="ems-chips">
            {chosen.slice(0, 3).map((e) => (
              <span key={e.id} className="ems-chip">{e.first_name} {e.last_name?.[0]}.</span>
            ))}
            {chosen.length > 3 && <span className="ems-chip ems-chip--more">+{chosen.length - 3}</span>}
          </span>
        )}
        <svg className="ems-caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="ems-panel">
          {employees.length > 5 && (
            <input
              type="search"
              className="ems-search"
              placeholder="Rechercher…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Rechercher un employé"
              autoFocus
            />
          )}
          <ul className="ems-list" id={listId} role="listbox" aria-multiselectable="true">
            {!q && (
              <li>
                <label className="ems-option ems-option--all">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                  {allLabel}
                </label>
              </li>
            )}
            {shown.map((e) => (
              <li key={e.id}>
                <label className="ems-option">
                  <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} />
                  <span className="ems-option-text">
                    <span>{e.first_name} {e.last_name}</span>
                    {e.job_title && <span className="ems-option-job">{e.job_title}</span>}
                  </span>
                </label>
              </li>
            ))}
            {shown.length === 0 && <li className="ems-none">Aucun résultat</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
