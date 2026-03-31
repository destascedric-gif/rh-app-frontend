import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { submitRequest } from '../../api/leaves';

const LEAVE_TYPES = [
  'Congés payés',
  'RTT',
  'Congé maladie',
  'Congé sans solde',
  'Congé maternité / paternité',
];

export default function LeaveRequestForm({ onSuccess, onCancel }) {
  const { token } = useAuth();

  const [form, setForm] = useState({
    leaveType: 'Congés payés',
    startDate: '',
    endDate:   '',
    reason:    '',
  });
  const [preview, setPreview] = useState(null); // nb jours ouvrés (calculé côté client)
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);

    // Aperçu du nb de jours (calcul simplifié côté client, sans fériés)
    if (updated.startDate && updated.endDate && updated.startDate <= updated.endDate) {
      const start = new Date(updated.startDate);
      const end   = new Date(updated.endDate);
      let days = 0;
      const cur = new Date(start);
      while (cur <= end) {
        const dow = cur.getDay();
        if (dow !== 0 && dow !== 6) days++;
        cur.setDate(cur.getDate() + 1);
      }
      setPreview(days);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await submitRequest(form, token);
      onSuccess?.(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Date minimale = aujourd'hui
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form className="leave-form" onSubmit={handleSubmit}>
      <h3>Nouvelle demande de congé</h3>

      <div className="field">
        <label>Type de congé *</label>
        <select name="leaveType" value={form.leaveType} onChange={handleChange}>
          {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="field-row">
        <div className="field">
          <label>Date de début *</label>
          <input
            type="date" name="startDate"
            value={form.startDate} min={today}
            onChange={handleChange} required
          />
        </div>
        <div className="field">
          <label>Date de fin *</label>
          <input
            type="date" name="endDate"
            value={form.endDate} min={form.startDate || today}
            onChange={handleChange} required
          />
        </div>
      </div>

      {/* Aperçu jours ouvrés */}
      {preview !== null && (
        <div className="leave-preview">
          ≈ <strong>{preview} jour(s) ouvré(s)</strong>
          <span className="text-muted"> (hors jours fériés, calculés côté serveur)</span>
        </div>
      )}

      <div className="field">
        <label>Motif <span className="hint">(optionnel)</span></label>
        <textarea
          name="reason" value={form.reason}
          onChange={handleChange} rows={3}
          placeholder="Précisez si nécessaire…"
        />
      </div>

      {error && <p className="error-msg">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Envoi…' : 'Envoyer la demande'}
        </button>
      </div>
    </form>
  );
}
