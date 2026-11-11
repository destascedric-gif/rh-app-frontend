import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { clearWeek } from '../../api/weekTemplates';
import { addDaysISO, countText } from './weekTemplateUtils';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

// « Vider cette semaine » (12 nov. 2026, demande de Cédric) : remet la
// semaine à zéro pour les salariés affichés. Les congés et absences sont
// gardés. Le planning propose ensuite « Annuler » pour tout remettre.
export default function ClearWeekModal({ weekStart, employees, allCount, shifts, onDone, onClose }) {
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const end = addDaysISO(weekStart, 6);
  const ids = new Set(employees.map((e) => e.id));
  const inWeek = shifts.filter((s) => ids.has(s.user_id) && s.date?.slice(0, 10) >= weekStart && s.date?.slice(0, 10) <= end);
  const work = inWeek.filter((s) => (s.type || 'travail') === 'travail').length;
  const rest = inWeek.filter((s) => s.type === 'repos').length;
  const kept = inWeek.length - work - rest;
  const filtered = employees.length < allCount;

  const a = new Date(`${weekStart}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  const period = `semaine du ${a.getDate()}${a.getMonth() === b.getMonth() ? '' : ` ${MONTHS[a.getMonth()]}`} au ${b.getDate()} ${MONTHS[b.getMonth()]}`;

  const confirm = async () => {
    setSaving(true);
    setError('');
    try {
      onDone(await clearWeek({ weekStart, userIds: employees.map((e) => e.id) }, token));
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="modal wt-modal wt-modal--narrow" role="dialog" aria-modal="true" aria-labelledby="wt-clear-title">
        <h3 id="wt-clear-title">Vider cette semaine ?</h3>
        <p className="wt-sub">
          {period[0].toUpperCase() + period.slice(1)} ·{' '}
          {filtered
            ? `seulement les ${employees.length} salarié${employees.length > 1 ? 's' : ''} affiché${employees.length > 1 ? 's' : ''}`
            : 'tous les salariés'}
        </p>

        <div className="wt-sum">
          {work + rest === 0 ? (
            <p><b>Rien à effacer</b> : cette semaine n'a ni créneau ni repos.</p>
          ) : (
            <p><b>{countText(work, rest)}</b> {work + rest > 1 ? 'seront effacés' : 'sera effacé'}.</p>
          )}
          <p>
            {kept > 0
              ? `• ${kept === 1 ? 'Le congé ou l\'absence de la semaine est gardé' : `Les ${kept} congés et absences de la semaine sont gardés`}.`
              : '• Les congés et absences ne sont jamais effacés.'}
          </p>
          <p>• Les réunions ne changent pas.</p>
          {filtered && <p>• Les autres salariés ne sont pas touchés (menu des employés).</p>}
          <p>• Juste après, un bouton « Annuler » permet de tout remettre.</p>
        </div>

        {error && <p className="error-msg">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Annuler</button>
          <button type="button" className="btn-danger" onClick={confirm} disabled={saving || work + rest === 0}>
            {saving ? 'Suppression…' : 'Vider la semaine'}
          </button>
        </div>
      </div>
    </div>
  );
}
