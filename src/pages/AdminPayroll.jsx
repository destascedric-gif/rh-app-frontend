import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEmployees } from '../api/employees';
import {
  getAllPayslips, generatePayslip, downloadPayslip,
  generateAllPayslips, deletePayslip, triggerDownload,
} from '../api/payroll';
import PageHeader from '../components/PageHeader';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin',
                 'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const euros = (n) => Number(n).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const monthWithArticle = (m) => (/^[AO]/.test(MONTHS[m - 1]) ? `d'${MONTHS[m - 1].toLowerCase()}` : `de ${MONTHS[m - 1].toLowerCase()}`);

export default function AdminPayroll() {
  const { token } = useAuth();
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [employees, setEmployees] = useState([]);
  const [payslips,  setPayslips]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [busy,      setBusy]      = useState(null);   // id employé / bulletin en cours, ou 'all'
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');

  useEffect(() => {
    getEmployees(token).then(setEmployees).catch((err) => setError(err.message));
  }, [token]);

  const loadPayslips = useCallback(async () => {
    try {
      setPayslips(await getAllPayslips({ year, month }, token));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [year, month, token]);

  useEffect(() => { loadPayslips(); }, [loadPayslips]);

  const notify = (msg, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); } else { setSuccess(msg); setError(''); }
  };

  const changeMonth = (delta) => {
    const d = new Date(year, month - 1 + delta, 1);
    setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
  };

  const actifs = employees.filter((e) => e.is_active);
  const slipFor = (userId) => payslips.find((p) => p.user_id === userId);
  const missing = actifs.filter((e) => !slipFor(e.id));
  const totalBrut = payslips.reduce((s, p) => s + parseFloat(p.gross_amount), 0);
  const periodLabel = `${MONTHS[month - 1]} ${year}`;

  const generateOne = async (emp) => {
    setBusy(emp.id);
    try {
      const blob = await generatePayslip({ userId: emp.id, month, year }, token);
      triggerDownload(blob, `bulletin_${emp.last_name}_${MONTHS[month - 1]}_${year}.pdf`);
      notify(`Bulletin de ${emp.first_name} ${emp.last_name} généré et téléchargé.`);
      await loadPayslips();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setBusy(null);
    }
  };

  const generateMissing = async () => {
    if (!confirm(`Générer les ${missing.length} bulletin(s) manquant(s) de ${periodLabel} ?`)) return;
    setBusy('all');
    try {
      const result = await generateAllPayslips({ month, year }, token);
      notify(result.message);
      await loadPayslips();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setBusy(null);
    }
  };

  const download = async (p) => {
    try {
      const blob = await downloadPayslip(p.id, token);
      triggerDownload(blob, `bulletin_${p.last_name}_${MONTHS[p.period_month - 1]}_${p.period_year}.pdf`);
    } catch (err) {
      notify(err.message, true);
    }
  };

  const remove = async (p) => {
    if (!confirm(`Supprimer le bulletin de ${p.first_name} ${p.last_name} (${periodLabel}) ? Cette action est irréversible.`)) return;
    setBusy(p.id);
    try {
      await deletePayslip(p.id, token);
      notify('Bulletin supprimé.');
      await loadPayslips();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="page">
      <PageHeader title="Paie" />

      {/* Avertissement permanent : les bulletins ne remplacent pas une paie déclarative */}
      <div className="payroll-disclaimer" role="note">
        <strong>Paie non certifiée.</strong> Orgaly n'est pas un logiciel de paie certifié et n'effectue
        aucune déclaration sociale (DSN). Les bulletins sont calculés avec des taux simplifiés, sans
        convention collective, allègements ni prélèvement à la source : faites-les vérifier par un
        professionnel de la paie avant de les remettre à vos salariés.
      </div>

      {/* Bandeau du mois */}
      <section className="payroll-banner">
        <div className="payroll-banner-period">
          <button type="button" className="payroll-nav" onClick={() => changeMonth(-1)} aria-label="Mois précédent">←</button>
          <div>
            <h2>Paie {monthWithArticle(month)} {year}</h2>
            <p>Bulletins indicatifs, non certifiés</p>
          </div>
          <button type="button" className="payroll-nav" onClick={() => changeMonth(1)} aria-label="Mois suivant">→</button>
        </div>
        <div className="payroll-banner-stat">
          <strong>{payslips.length} / {actifs.length}</strong>
          <span>Bulletins générés</span>
        </div>
        <div className="payroll-banner-stat">
          <strong>{euros(totalBrut)}</strong>
          <span>Masse salariale brute</span>
        </div>
        {missing.length > 0 ? (
          <button type="button" className="btn-primary payroll-banner-cta" disabled={busy === 'all'} onClick={generateMissing}>
            {busy === 'all' ? 'Génération…' : `Générer ${missing.length > 1 ? `les ${missing.length} bulletins manquants` : 'le bulletin manquant'}`}
          </button>
        ) : (
          <span className="payroll-banner-done">Tous les bulletins sont générés</span>
        )}
      </section>

      {error   && <div className="notif-bar notif-bar--danger">{error}</div>}
      {success && <div className="notif-bar notif-bar--success">{success}</div>}

      {loading ? (
        <p className="tab-loading">Chargement…</p>
      ) : actifs.length === 0 ? (
        <p className="empty-state">Aucun employé actif.</p>
      ) : (
        <div className="table-wrap">
          <table className="rh-table">
            <thead>
              <tr>
                <th>Employé</th>
                <th>Brut</th>
                <th>Net</th>
                <th>Bulletin</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {actifs.map((emp) => {
                const p = slipFor(emp.id);
                return (
                  <tr key={emp.id}>
                    <td>
                      <div className="emp-name">{emp.first_name} {emp.last_name}</div>
                      {emp.job_title && <div className="emp-email">{emp.job_title}</div>}
                    </td>
                    <td>{p ? euros(p.gross_amount) : (emp.gross_salary ? euros(emp.gross_salary) : '—')}</td>
                    <td>{p ? <strong>{euros(p.net_amount)}</strong> : '—'}</td>
                    <td>
                      {p
                        ? <span className="badge badge-info">Généré</span>
                        : <span className="badge badge-pending">À générer</span>}
                    </td>
                    <td>
                      <div className="payroll-row-actions">
                        {p ? (
                          <>
                            <button type="button" className="btn-secondary btn-sm" onClick={() => download(p)}>PDF</button>
                            <button type="button" className="btn-ghost btn-sm" style={{ color: 'var(--danger)' }} disabled={busy === p.id} onClick={() => remove(p)}>Supprimer</button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="btn-primary btn-sm"
                            disabled={busy === emp.id || !emp.gross_salary}
                            title={emp.gross_salary ? undefined : 'Renseignez le salaire brut dans la fiche employé'}
                            onClick={() => generateOne(emp)}
                          >
                            {busy === emp.id ? 'Génération…' : 'Générer'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
