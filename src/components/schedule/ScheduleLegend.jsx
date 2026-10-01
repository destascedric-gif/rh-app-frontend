export default function ScheduleLegend() {
  return (
    <div className="schedule-legend">
      <span className="legend-item">
        <span className="legend-swatch">
          <span className="legend-swatch-dot" style={{ background: 'var(--shift-open)' }} />
        </span>
        Ouverture
      </span>
      <span className="legend-item">
        <span className="legend-swatch">
          <span className="legend-swatch-dot" style={{ background: 'var(--shift-close)' }} />
        </span>
        Fermeture
      </span>
    </div>
  );
}
