import { useState, useRef, useEffect } from 'react';
import { WeekLoadIcon } from './WeekTemplatePreview';
import { summarize } from './weekTemplateUtils';

const icon = {
  width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
};

export const WeekIcon = (props) => (
  <svg {...icon} {...props}>
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
    <path d="M3 9.5h18M8 3v3M16 3v3M7.5 13.5h2M11 13.5h2M14.5 13.5h2M7.5 17h2M11 17h2" />
  </svg>
);

// Bouton « Semaines types » de la vue Semaine (11 nov. 2026) et son menu :
// remplir la semaine avec une semaine type, copier la semaine précédente,
// enregistrer la semaine affichée, aller gérer la liste (Paramètres).
export default function WeekTemplatesMenu({ weekTemplates, onApply, onCopyPrevious, onSave, onManage }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const pick = (fn) => () => { setOpen(false); fn(); };

  return (
    <div className="wt-menu-wrap" ref={ref}>
      <button
        type="button"
        className={`wt-btn${open ? ' wt-btn--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <WeekIcon />
        <span className="wt-btn-label">Semaines types</span>
        <svg {...icon} width="14" height="14" strokeWidth="2.2"><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {open && (
        <div className="wt-menu" role="menu">
          <div className="wt-menu-label">Remplir cette semaine avec</div>
          {weekTemplates.length === 0 ? (
            <p className="wt-menu-empty">
              Aucune semaine type pour l'instant. Préparez une semaine, puis enregistrez-la ci-dessous.
            </p>
          ) : weekTemplates.map((t) => (
            <button key={t.id} type="button" role="menuitem" className="wt-menu-item" onClick={pick(() => onApply(t))}>
              <WeekLoadIcon slots={t.slots} />
              <span className="wt-menu-text">{t.name}</span>
              <small>{summarize(t.slots).people} salarié{summarize(t.slots).people > 1 ? 's' : ''}</small>
            </button>
          ))}
          <div className="wt-menu-sep" />
          <button type="button" role="menuitem" className="wt-menu-item" onClick={pick(onCopyPrevious)}>
            <svg {...icon}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>
            <span className="wt-menu-text">Copier la semaine précédente</span>
          </button>
          <button type="button" role="menuitem" className="wt-menu-item" onClick={pick(onSave)}>
            <svg {...icon}><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v5h7V4M8 20v-6h8v6" /></svg>
            <span className="wt-menu-text">Enregistrer cette semaine comme semaine type…</span>
          </button>
          <button type="button" role="menuitem" className="wt-menu-item" onClick={pick(onManage)}>
            <svg {...icon}><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /></svg>
            <span className="wt-menu-text">Gérer les semaines types</span>
            <small>Paramètres</small>
          </button>
        </div>
      )}
    </div>
  );
}
