import { useState, useRef, useEffect } from 'react';

// Planning du gérant sur téléphone (proposition « B » choisie par Cédric le
// 11 nov. 2026) : deux petits boutons dans la barre du haut, à côté de la
// cloche, au lieu de deux rangées de boutons au-dessus du planning.
// - entonnoir : affiche ou cache le choix des employés (point bleu si un
//   filtre est actif) ;
// - « + » : petit menu « Nouveau créneau » / « Réunion ».

const iconProps = {
  width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
};

export default function ScheduleTopbarButtons({ filterOpen, filterActive, onToggleFilter, onNewShift, onNewMeeting }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef(null);

  // Fermeture au toucher à côté ou avec Échap
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => { if (!rootRef.current?.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const choose = (action) => { setMenuOpen(false); action(); };

  return (
    <div className="tb-sched" ref={rootRef}>
      <button
        type="button"
        className={`bell-btn tb-sched-btn${filterOpen ? ' tb-sched-btn--on' : ''}`}
        onClick={onToggleFilter}
        aria-pressed={filterOpen}
        aria-label="Choisir les employés affichés"
      >
        <svg {...iconProps}><path d="M4 5h16l-6.2 7.4V18l-3.6 2v-7.6z" /></svg>
        {filterActive && <span className="tb-sched-dot" aria-hidden="true" />}
      </button>
      <button
        type="button"
        className="bell-btn tb-sched-btn tb-sched-btn--plus"
        onClick={() => setMenuOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Ajouter un créneau ou une réunion"
      >
        <svg {...iconProps}><path d="M12 5v14M5 12h14" /></svg>
      </button>
      {menuOpen && (
        <div className="tb-sched-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => choose(onNewShift)}>Nouveau créneau</button>
          <button type="button" role="menuitem" onClick={() => choose(onNewMeeting)}>Réunion</button>
        </div>
      )}
    </div>
  );
}
