// Affiche un créneau dans la grille planning

const formatTime = (t) => t?.slice(0, 5) ?? '';

export default function ShiftCard({ shift, isAdmin, onClick, onDelete }) {
  const totalBreakMin = shift.breaks?.reduce((sum, b) => {
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    return sum + (toMin(b.end_time) - toMin(b.start_time));
  }, 0) ?? 0;

  return (
    <div className="shift-card" onClick={onClick}>
      <div className="shift-times">
        {formatTime(shift.start_time)} → {formatTime(shift.end_time)}
      </div>

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

      {shift.note && (
        <div className="shift-note">{shift.note}</div>
      )}

      {isAdmin && (
        <button
          className="shift-delete-btn"
          onClick={(e) => { e.stopPropagation(); onDelete?.(shift); }}
          title="Supprimer ce créneau"
        >
          ×
        </button>
      )}
    </div>
  );
}
