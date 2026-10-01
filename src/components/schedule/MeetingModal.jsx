import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createMeeting, updateMeeting, deleteMeeting } from '../../api/meetings';
import EmployeeMultiSelect from '../EmployeeMultiSelect';

const hhmm = (t) => t?.slice(0, 5) ?? '';

// Création / modification d'une réunion avec plusieurs participants.
// shifts + range : créneaux déjà chargés, pour signaler les participants
// dont la réunion tombe en dehors du créneau de travail.
export default function MeetingModal({ meeting, date, employees, shifts, range, onClose, onSaved, onDeleted }) {
  const { token } = useAuth();
  const isEdit = !!meeting;

  const [form, setForm] = useState({
    title:          meeting?.title ?? 'Réunion',
    date:           meeting?.date ?? date ?? '',
    startTime:      hhmm(meeting?.start_time) || '14:00',
    endTime:        hhmm(meeting?.end_time) || '15:00',
    note:           meeting?.note ?? '',
    participantIds: meeting?.participants?.map((p) => p.id) ?? [],
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Participants qui ne travaillent pas sur toute la durée de la réunion
  const inRange = range && form.date >= range.start && form.date <= range.end;
  const outside = inRange && form.startTime < form.endTime
    ? employees.filter((emp) => {
      if (!form.participantIds.includes(emp.id)) return false;
      const shift = shifts.find((s) => s.user_id === emp.id && s.date?.slice(0, 10) === form.date);
      const working = shift && (shift.type || 'travail') === 'travail';
      return !working || form.startTime < hhmm(shift.start_time) || form.endTime > hhmm(shift.end_time);
    })
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.participantIds.length === 0) {
      setError('Choisissez au moins un participant.');
      return;
    }
    setLoading(true);
    try {
      const saved = isEdit
        ? await updateMeeting(meeting.id, form, token)
        : await createMeeting(form, token);
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cette réunion ?')) return;
    setLoading(true);
    try {
      await deleteMeeting(meeting.id, token);
      onDeleted?.(meeting.id);
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 480 }}>
        <h3>{isEdit ? 'Modifier la réunion' : 'Nouvelle réunion'}</h3>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Titre</label>
            <input type="text" maxLength={120} value={form.title} onChange={set('title')} placeholder="Réunion d'équipe" />
          </div>

          <div className="field">
            <label>Participants *</label>
            <EmployeeMultiSelect
              employees={employees}
              value={form.participantIds}
              onChange={(ids) => setForm((f) => ({ ...f, participantIds: ids }))}
              placeholder="Choisir les participants…"
            />
          </div>

          <div className="field">
            <label>Date *</label>
            <input type="date" value={form.date} onChange={set('date')} required />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Début *</label>
              <input type="time" value={form.startTime} onChange={set('startTime')} required />
            </div>
            <div className="field">
              <label>Fin *</label>
              <input type="time" value={form.endTime} onChange={set('endTime')} required />
            </div>
          </div>

          <div className="field">
            <label>Note <span className="hint">(optionnel)</span></label>
            <input type="text" maxLength={255} value={form.note} onChange={set('note')} placeholder="Ordre du jour, lieu…" />
          </div>

          {outside.length > 0 && (
            <p className="settings-warning">
              En dehors du créneau de travail de : {outside.map((e) => `${e.first_name} ${e.last_name}`).join(', ')}.
              Ces heures ne sont pas comptées dans leur temps de travail : ajustez leur créneau si elles doivent l'être.
            </p>
          )}

          {error && <p className="error-msg">{error}</p>}

          <div className="form-actions">
            {isEdit && (
              <button type="button" className="btn-ghost" style={{ color: 'var(--danger)', marginRight: 'auto' }} onClick={handleDelete} disabled={loading}>
                Supprimer
              </button>
            )}
            <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer la réunion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
