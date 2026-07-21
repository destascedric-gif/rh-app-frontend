import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMonthlySummary } from '../../api/employees';

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

export default function MonthlySummaryTab({ employeeId }) {
  const { token } = useAuth();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMonthlySummary(employeeId, { month, year }, token)
      .then(setSummary)
      .finally(() => setLoading(false));
  }, [employeeId, month, year, token]);

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="timesheet-tab">
      <div className="timesheet-filters">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading || !summary ? (
        <p className="tab-loading">Chargement…</p>
      ) : (
        <>
          <div className="timesheet-summary">
            <div className="summary-card">
              <div className="summary-value">{summary.totalHours.toFixed(1)} h</div>
              <div className="summary-label">Heures travaillées</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{summary.daysWorked}</div>
              <div className="summary-label">Jours pointés</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">
                {summary.payslip ? `${Number(summary.payslip.net_amount).toLocaleString('fr-FR')} €` : '—'}
              </div>
              <div className="summary-label">Net du mois</div>
            </div>
          </div>

          <section className="info-section">
            <h2>Congés pris ce mois-ci</h2>
            {summary.leaveDays.length === 0 ? (
              <p className="empty-state">Aucun congé approuvé sur cette période.</p>
            ) : (
              <div className="info-grid">
                {summary.leaveDays.map((l) => (
                  <div className="info-row" key={l.leaveType}>
                    <span className="info-label">{l.leaveType}</span>
                    <span className="info-value">{l.days} j</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="info-section">
            <h2>Bulletin de paie</h2>
            {summary.payslip ? (
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-label">Brut</span>
                  <span className="info-value">{Number(summary.payslip.gross_amount).toLocaleString('fr-FR')} €</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Net</span>
                  <span className="info-value">{Number(summary.payslip.net_amount).toLocaleString('fr-FR')} €</span>
                </div>
              </div>
            ) : (
              <p className="empty-state">Aucun bulletin généré pour cette période.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
