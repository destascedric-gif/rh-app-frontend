import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTimesheets } from '../../api/employees';

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

const formatTime = (t) => t ? t.slice(0, 5) : '—';

export default function TimesheetTab({ employeeId }) {
  const { token } = useAuth();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [rows,  setRows]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTimesheets(employeeId, { month, year }, token)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [employeeId, month, year, token]);

  // Totaux du mois
  const totalHours = rows.reduce((sum, r) => sum + (parseFloat(r.total_hours) || 0), 0);
  const daysWorked = rows.filter((r) => r.clock_in).length;

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="timesheet-tab">
      {/* Filtres mois / année */}
      <div className="timesheet-filters">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
