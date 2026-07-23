import { getEmployeeColor } from './employeeColor';

// Trois couleurs de la palette, à titre d'exemple, pour illustrer le principe
// sans dépendre des employés réellement affichés.
const SAMPLE_IDS = ['a', 'b', 'c'];

export default function ScheduleLegend() {
  return (
    <div className="schedule-legend">
      <span className="legend-item">
        <span className="legend-swatch">
          {SAMPLE_IDS.map((id) => (
            <span key={id} className="legend-swatch-dot" style={{ background: getEmployeeColor(id) }} />
          ))}
        </span>
        Une couleur par employé
      </span>
      <span className="legend-item">
        <em>Congé / Repos / Absence</em> en italique
      </span>
    </div>
  );
}
