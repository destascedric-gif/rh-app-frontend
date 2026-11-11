import { NEUTRAL_SHIFT_COLOR } from './shiftColor';
import { WEEKDAY_LABELS, addDaysISO, shortTime, shiftShort, colorOfSlot, dayLoads } from './weekTemplateUtils';

// Petit histogramme d'une semaine type (dans le menu et dans Paramètres) :
// une barre par jour, d'autant plus haute que l'équipe y est nombreuse.
export function WeekLoadIcon({ slots }) {
  const loads = dayLoads(slots);
  const max = Math.max(1, ...loads);
  return (
    <span className="wt-load" aria-hidden="true">
      {loads.map((n, i) => (
        <i key={i} style={{ height: `${n === 0 ? 2 : 4 + Math.round((n / max) * 10)}px`, opacity: n === 0 ? 0.35 : 1 }} />
      ))}
    </span>
  );
}

// Aperçu d'une semaine type : une ligne par salarié, une colonne par jour.
// plan (facultatif) : résultat de planApply, pour montrer les cases gardées
// (déjà remplies, ou congé / absence) au lieu de ce que la semaine type y mettrait.
export default function WeekTemplatePreview({ slots = [], employees, shiftTemplates, weekStart, plan }) {
  const people = employees.filter((e) => slots.some((s) => s.userId === e.id));
  const slotAt = (userId, weekday) => slots.find((s) => s.userId === userId && s.weekday === weekday);

  if (people.length === 0) {
    return <p className="wt-prev-empty">Aucun salarié actuel dans cette semaine type.</p>;
  }

  return (
    <div className="wt-prev">
      <table>
        <thead>
          <tr>
            <th aria-label="Salarié" />
            {WEEKDAY_LABELS.map((d, i) => (
              <th key={d}>{d}{weekStart ? ` ${Number(addDaysISO(weekStart, i).slice(8))}` : ''}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {people.map((e) => (
            <tr key={e.id}>
              <td className="wt-prev-name">{e.first_name}</td>
              {WEEKDAY_LABELS.map((_, i) => {
                const cell = plan?.cells.get(`${e.id}|${i}`);
                if (cell && (cell.status === 'kept' || cell.status === 'protected')) {
                  return (
                    <td key={i} className="wt-cell wt-cell--kept" title="Déjà posé : gardé">
                      {shiftShort(cell.existing)}<em>gardé</em>
                    </td>
                  );
                }
                const slot = slotAt(e.id, i);
                if (!slot) return <td key={i} className="wt-cell wt-cell--empty">—</td>;
                if (slot.type === 'repos') return <td key={i} className="wt-cell wt-cell--rest">Repos</td>;
                const color = colorOfSlot(slot, shiftTemplates);
                return (
                  <td
                    key={i}
                    className={`wt-cell ${color ? 'wt-cell--work' : 'wt-cell--manual'}`}
                    style={color ? { '--shift-color': color } : { '--shift-color': NEUTRAL_SHIFT_COLOR }}
                  >
                    {shortTime(slot.startTime)}–{shortTime(slot.endTime)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
