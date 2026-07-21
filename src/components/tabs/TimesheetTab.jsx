import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTimesheets, addTimesheet, updateTimesheet, deleteTimesheet } from '../../api/employees';

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

const formatTime = (t) => t ? t.slice(0, 5) : '—';

const EMPTY_FORM = { date: '', clockIn: '', clockOut: '', breakMinutes: 0, note: '' };

export default function TimesheetTab({ employeeId }) {
  const { token } = useAuth();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [rows,  setRows]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // null = pas de form, 'new' = ajout
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    return getTimesheets(employeeId, { month, year }, token)
      .then(setRows)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [employeeId, month, year, token]);

  const totalHours = rows.reduce((sum, r) => sum + (parseFloat(r.total_hours) || 0), 0);
  const daysWorked = rows.filter((r) => r.clock_in).length;
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  const openNew = () => {
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) });
    setEditingId('new');
    setError('');
  };

  const openEdit = (r) => {
    setForm({
      date: r.date.slice(0, 10),
      clockIn: r.clock_in?.slice(0, 5) ?? '',
      clockOut: r.clock_out?.slice(0, 5) ?? '',
      breakMinutes: r.break_minutes ?? 0,
      note: r.note ?? '',
    });
    setEditingId(r.id);
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId === 'new') {
        await addTimesheet(employeeId, form, token);
      } else {
        await updateTimesheet(employeeId, editingId, form, token);
      }
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      await deleteTimesheet(employeeId, id, token);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="timesheet-tab">
      {/* Filtres mois / année */}
      <div className="timesheet-filters" style={{ justifyContent: 'space-between', display: 'flex' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Ajouter une entrée</button>
      </div>

      {/* Résumé du mois */}
      <div className="timesheet-summary">
        <div className="summary-card">
          <div className="summary-value">{daysWorked}</div>
          <div className="summary-label">Jours travaillés</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{totalHours.toFixed(1)} h</div>
          <div className="summary-label">Heures totales</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">
            {daysWorked > 0 ? (totalHours / daysWorked).toFixed(1) : '—'} h
          </div>
          <div className="summary-label">Moyenne / jour</div>
        </div>
      </div>

      {/* Tableau de pointage */}
      {loading ? (
        <p className="tab-loading">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="empty-state">Aucun pointage pour cette période.</p>
      ) : (
        <table className="rh-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Arrivée</th>
              <th>Départ</th>
              <th>Pause</th>
              <th>Total</th>
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</td>
                <td>{formatTime(r.clock_in)}</td>
                <td>{formatTime(r.clock_out)}</td>
                <td>{r.break_minutes ? `${r.break_minutes} min` : '—'}</td>
                <td><strong>{r.total_hours ? `${r.total_hours} h` : '—'}</strong></td>
                <td className="text-muted">{r.note || ''}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-ghost" style={{ padding: '3px 8px' }} onClick={() => openEdit(r)}>Modifier</button>
                    <button className="btn-ghost" style={{ padding: '3px 8px', color: 'var(--danger)' }} onClick={() => handleDelete(r.id)} disabled={saving}>×</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editingId && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <h3>{editingId === 'new' ? 'Ajouter une entrée de pointage' : 'Modifier l\'entrée'}</h3>
            <form onSubmit={handleSave}>
              <div className="field">
                <label>Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                  disabled={editingId !== 'new'}
                  required
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Arrivée</label>
                  <input type="time" value={form.clockIn} onChange={(e) => setForm(f => ({ ...f, clockIn: e.target.value }))} />
                </div>
                <div className="field">
                  <label>Départ</label>
                  <input type="time" value={form.clockOut} onChange={(e) => setForm(f => ({ ...f, clockOut: e.target.value }))} />
                </div>
              </div>
              <div className="field">
                <label>Pause (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={form.breakMinutes}
                  onChange={(e) => setForm(f => ({ ...f, breakMinutes: e.target.value }))}
                />
              </div>
              <div className="field">
                <label>Note <span className="hint">(optionnel)</span></label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="Ex : rattrapage, oubli de badge…"
                />
              </div>

              {error && <p className="error-msg">{error}</p>}

              <div className="form-actions">
                <button type="button" className="btn-ghost" onClick={() => setEditingId(null)} disabled={saving}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
