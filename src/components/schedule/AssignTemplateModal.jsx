import { useState } from 'react';
import { DETAIL_DAY_NAMES, DETAIL_MONTH_NAMES } from './dayDetailUtils';
import { NEUTRAL_SHIFT_COLOR } from './shiftColor';

// Horaire type lâché sur un jour du mois (11 nov. 2026, demande de Cédric) :
// on choisit à quels salariés l'appliquer. Plusieurs d'un coup ; ceux qui
// ont déjà un créneau ce jour-là sont signalés (« déjà : … ») et jamais
// cochés d'avance : les cocher remplace leur créneau.

const TYPE_LABELS = { conge: 'Congé', repos: 'Repos', absence: 'Absence', absent: 'Absent' };

// "09:30:00" → "9h30", "19:00" → "19h"
const shortTime = (t) => {
  const [h, m] = (t ?? '').slice(0, 5).split(':');
  return `${Number(h)}h${m === '00' ? '' : m}`;
};

const shiftText = (s) => ((s.type || 'travail') === 'travail'
  ? `${shortTime(s.start_time)}–${shortTime(s.end_time)}`
  : TYPE_LABELS[s.type] ?? s.type);

const templateText = (t) => (t.kind === 'repos'
  ? 'jour non travaillé'
  : `${t.start_time?.slice(0, 5)} → ${t.end_time?.slice(0, 5)}`);

export default function AssignTemplateModal({ date, template, employees, shifts, onApply, onClose }) {
  const [checked, setChecked] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const d = new Date(`${date}T12:00:00`);
  const dayText = `${DETAIL_DAY_NAMES[d.getDay()].toLowerCase()} ${d.getDate()} ${DETAIL_MONTH_NAMES[d.getMonth()]}`;
  const existing = (id) => shifts.find((s) => s.user_id === id && s.date?.slice(0, 10) === date);
  const free = employees.filter((e) => !existing(e.id));
  const replacing = checked.filter((id) => existing(id)).length;

  const toggle = (id) => setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const apply = async () => {
    setSaving(true);
    setError('');
    const failed = await onApply(checked);
    setSaving(false);
    if (failed.length === 0) { onClose(); return; }
    setChecked(failed.map((f) => f.id));
    setError(failed.map((f) => f.message).join(' '));
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="modal assign-modal" style={{ maxWidth: 440 }}>
        <h3>À quels salariés ?</h3>
        <p
          className={`assign-template${template.kind === 'repos' ? ' assign-template--rest' : ''}`}
          style={template.kind === 'repos' ? undefined : { '--shift-color': template.color || NEUTRAL_SHIFT_COLOR }}
        >
          <strong>{template.name}</strong> ({templateText(template)}) · {dayText}
        </p>

        {employees.length === 0 ? (
          <p className="text-muted">Aucun salarié affiché.</p>
        ) : (
          <>
            {free.length > 1 && (
              <button
                type="button"
                className="btn-ghost btn-sm assign-all"
                onClick={() => setChecked(free.map((e) => e.id))}
              >
                Cocher tous ceux sans créneau ({free.length})
              </button>
            )}
            <ul className="assign-list">
              {employees.map((e) => {
                const s = existing(e.id);
                return (
                  <li key={e.id}>
                    <label className={`assign-row${checked.includes(e.id) ? ' assign-row--on' : ''}`}>
                      <input type="checkbox" checked={checked.includes(e.id)} onChange={() => toggle(e.id)} />
                      <span className="assign-name">
                        {e.first_name} {e.last_name}
                        {e.job_title && <span className="assign-job">{e.job_title}</span>}
                      </span>
                      {s && <span className="assign-busy">déjà : {shiftText(s)}</span>}
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {replacing > 0 && (
          <p className="hint assign-warn">
            {replacing === 1 ? 'Un créneau existant sera remplacé.' : `${replacing} créneaux existants seront remplacés.`}
          </p>
        )}
        {error && <p className="error-msg">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Annuler</button>
          <button type="button" className="btn-primary" onClick={apply} disabled={saving || checked.length === 0}>
            {saving ? 'Enregistrement…' : checked.length > 1 ? `Appliquer (${checked.length})` : 'Appliquer'}
          </button>
        </div>
      </div>
    </div>
  );
}
