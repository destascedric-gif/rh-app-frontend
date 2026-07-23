const TYPES = [
  { type: 'travail', label: 'Travail' },
  { type: 'conge',    label: 'Congé' },
  { type: 'repos',    label: 'Repos' },
  { type: 'absence',  label: 'Absence' },
];

export default function ScheduleLegend() {
  return (
    <div className="schedule-legend">
      {TYPES.map((t) => (
        <span key={t.type} className="legend-item">
          <span className={`legend-dot legend-dot--${t.type}`} />
          {t.label}
        </span>
      ))}
    </div>
  );
}
