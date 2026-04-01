const formatTime = (t) => t?.slice(0, 5) ?? '';

export default function ShiftCard({ shift, isAdmin, onClick, onDelete, compact = false }) {
  const name = shift.last_name
    ? `${shift.first_name?.[0]}. ${shift.last_name}`
    : null;
  const hours = `${formatTime(shift.start_time)} → ${formatTime(shift.end_time)}`;

  // Mode compact : badge 1 ligne (vue mois et vue semaine)
  if (compact) {
    return (
      <div
        className="month-shift-badge"
        onClick={onClick}
        title={name ? `${name} · ${hours}` : hours}
      >
        {name && <span className="badge-name">{name}</span>}
        <span className="badge-hours">{hours}</span>
        {isAdmin && (
          <button
            className="shift-delete-btn-inline"
            onClick={(e) => { e.stopPropagation(); onDelete?.(shift); }}
            title="Supprimer"
          >×</button>
        )}
      </div>
    );
  }

  // Mode détaillé : carte complète (non utilisé pour l'instant, conservé pour évolution)
  return (
    <div className="shift-card" onClick={onClick}>
      <div className="shift-times">{hours}</div>
      {shift.breaks?.length > 0 && (
        <div className="shift-breaks">
          {shift.breaks.map((b, i) => (
            <span key={i} className="shift-break-tag">
              {b.label} {formatTime(b.start_time)}–{formatTime(b.end_time)}
            </span>
          ))}
        </div>
      )}
      <div className="shift-net">
        {shift.net_hours ? `${shift.net_hours}h nettes` : ''}
      </div>
      {shift.note && <div className="shift-note">{shift.note}</div>}
      {isAdmin && (
        <button
          className="shift-delete-btn"
          onClick={(e) => { e.stopPropagation(); onDelete?.(shift); }}
          title="Supprimer ce créneau"
        >×</button>
      )}
    </div>
  );
}