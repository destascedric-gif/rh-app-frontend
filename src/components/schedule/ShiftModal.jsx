import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createShift, updateShift } from '../../api/schedule';

// Pause par défaut (déjeuner 1h)
const DEFAULT_BREAK = { start_time: '12:00', end_time: '13:00', label: 'Pause déjeuner' };

export default function ShiftModal({ shift, date, userId, employees, onClose, onSaved }) {
  const { token } = useAuth();
  const isEdit    = !!shift;

  const [form, setForm] = useState({
    userId:    userId ?? shift?.user_id ?? '',
    date:      date   ?? shift?.date    ?? '',
    startTime: shift?.start_time?.slice(0,5) ?? '09:00',
    endTime:   shift?.end_time?.slice(0,5)   ?? '17:00',
    note:      shift?.note ?? '',
    breaks:    shift?.breaks?.map(b => ({
      start_time: b.start_time.slice(0,5),
      end_time:   b.end_time.slice(0,5),
      label:      b.label,
    })) ?? [{ ...DEFAULT_BREAK }],
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Calcul aperçu durée nette
  const netMinutes = (() => {
    const toMin = (t) => { const [h,m] = t.split(':').map(Number); return h*60+m; };
    const total  = toMin(form.endTime) - toMin(form.startTime);
    const breaks = form.breaks.reduce((s, b) => s + (toMin(b.end_time) - toMin(b.start_time)), 0);
    return Math.max(0, total - breaks);
  })();

  const addBreak = () =>
    setForm(f => ({ ...f, breaks: [...f.breaks, { start_time: '', end_time: '', label: 'Pause' }] }));

  const removeBreak = (i) =>
    setForm(f => ({ ...f, breaks: f.breaks.filter((_, idx) => idx !== i) }));

  const updateBreak = (i, field, value) =>
    setForm(f => ({
      ...f,
      breaks: f.breaks.map((b, idx) => idx === i ? { ...b, [field]: value } : b),
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      userId:    form.userId,
      date:      form.date,
      startTime: form.startTime,
      endTime:   form.endTime,
      note:      form.note,
      breaks:    form.breaks.map(b => ({
        start_time: b.start_time,
        end_time:   b.end_time,
        label:      b.label || 'Pause',
      })),
    };

    try {
      const saved = isEdit
        ? await updateShift(shift.id, payload, token)
        : await createShift(payload, token);
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 480 }}>
        <h3>{isEdit ? 'Modifier le créneau' : 'Nouveau créneau'}</h3>

        <form onSubmit={handleSubmit}>
          {/* Employé (si non présélectionné) */}
          {!userId && employees && (
            <div className="field">
              <label>Employé *</label>
              <select
                value={form.userId}
                onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                required
              >
                <option value="">Sélectionner…</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date */}
          <div className="field">
            <label>Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              required
            />
          </div>

          {/* Horaires */}
          <div className="field-row">
            <div className="field">
              <label>Début *</label>
              <input
                type="time"
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label>Fin *</label>
              <input
                type="time"
                value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Aperçu durée nette */}
          <div className="leave-preview">
            Durée nette : <strong>{Math.floor(netMinutes/60)}h{netMinutes%60 > 0 ? `${netMinutes%60}min` : ''}</strong>
            <span className="text-muted"> (pauses déduites)</span>
          </div>

          {/* Pauses */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontWeight: 500, fontSize: 13 }}>Pauses</label>
              <button type="button" className="btn-ghost" style={{ fontSize: 12, padding: '3px 10px' }} onClick={addBreak}>
                + Ajouter une pause
              </button>
            </div>

            {form.breaks.map((b, i) => (
              <div key={i} className="break-row">
                <input
                  type="text"
                  value={b.label}
                  onChange={e => updateBreak(i, 'label', e.target.value)}
                  placeholder="Label"
                  style={{ flex: 2 }}
                />
                <input
                  type="time"
                  value={b.start_time}
                  onChange={e => updateBreak(i, 'start_time', e.target.value)}
                  style={{ flex: 1 }}
                />
                <span style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>→</span>
                <input
                  type="time"
                  value={b.end_time}
                  onChange={e => updateBreak(i, 'end_time', e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: '3px 8px', color: 'var(--color-text-danger)' }}
                  onClick={() => removeBreak(i)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Note */}
          <div className="field" style={{ marginTop: '1rem' }}>
            <label>Note <span className="hint">(optionnel)</span></label>
            <input
              type="text"
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Ex : réunion d'équipe le matin"
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le créneau'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
