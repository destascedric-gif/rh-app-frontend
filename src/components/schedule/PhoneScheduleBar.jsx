// Barre de navigation du planning sur téléphone (proposition « B » choisie
// par Cédric le 11 nov. 2026) : une seule ligne ‹ période › + Semaine/Mois,
// « Aujourd'hui » en petit sous la date. Utilisée par le planning du gérant
// et par « Mon planning » de l'employé.
export default function PhoneScheduleBar({ label, onPrev, onNext, onToday, view, onView, showToggle = true }) {
  return (
    <div className="schedule-bar-phone">
      <button className="btn-ghost sbp-arrow" onClick={onPrev} aria-label="Période précédente">‹</button>
      <div className="sbp-period">
        <span className="sbp-label">{label}</span>
        <button type="button" className="sbp-today" onClick={onToday}>Aujourd'hui</button>
      </div>
      <button className="btn-ghost sbp-arrow" onClick={onNext} aria-label="Période suivante">›</button>
      {showToggle && (
        <div className="role-toggle sbp-toggle">
          <button className={`role-btn ${view === 'week' ? 'active' : ''}`} onClick={() => onView('week')}>Sem.</button>
          <button className={`role-btn ${view === 'month' ? 'active' : ''}`} onClick={() => onView('month')}>Mois</button>
        </div>
      )}
    </div>
  );
}
