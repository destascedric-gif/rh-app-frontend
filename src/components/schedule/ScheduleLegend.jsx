import { NEUTRAL_SHIFT_COLOR } from './shiftColor';

// Légende du planning : un repère de couleur par horaire type, plus la
// couleur neutre des créneaux saisis à la main.
export default function ScheduleLegend({ templates = [] }) {
  if (templates.length === 0) return null;

  return (
    <div className="schedule-legend">
      {templates.map((t) => (
        <span key={t.id} className="legend-item">
          <span className="legend-swatch">
            <span className="legend-swatch-dot" style={{ background: t.color || NEUTRAL_SHIFT_COLOR }} />
          </span>
          {t.name}
        </span>
      ))}
      <span className="legend-item">
        <span className="legend-swatch">
          <span className="legend-swatch-dot" style={{ background: NEUTRAL_SHIFT_COLOR }} />
        </span>
        Autre horaire
      </span>
    </div>
  );
}
