import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEmployees } from '../api/employees';
import {
  getAllPayslips, generatePayslip, downloadPayslip,
  generateAllPayslips, deletePayslip, triggerDownload,
} from '../api/payroll';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin',
                 'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const now = new Date();

export default function AdminPayroll() {
  const { token } = useAuth();

  const [employees,  setEmployees]  = useState([]);
  const [payslips,   setPayslips]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  // Filtres
  const [filterYear,  setFilterYear]  = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState('');

  // Formulaire génération individuelle
  const [genUserId, setGenUserId] = useState('');
  const [genMonth,  setGenMonth]  = useState(now.getMonth() + 1);
  const [genYear,   setGenYear]   = useState(now.getFullYear());

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  useEffect(() => {
    getEmployees(token).then(setEmployees).catch(console.error);
  }, [token]);

  const loadPayslips = async () => {
    setLoading(true);
    try {
      const filters = { year: filterYear };
      if (filterMonth) filters.month = filterMonth;
      const data = await getAllPayslips(filters, token);
      setPayslips(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPayslips(); }, [filterYear, filterMonth, token]);

  const notify = (msg, isError = false) => {
    if (isError) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  // Génération d'un bulletin individuel
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!genUserId) return notify('Sélectionnez un employé.', true);
    setGenerating(true);
    try {
      const blob     = await generatePayslip({ userId: genUserId, month: genMonth, year: genYear }, token);
      const emp      = employees.find(e => e.id === genUserId);
      const filename = `bulletin_${emp?.last_name ?? 'employe'}_${MONTHS[genMonth-1]}_${genYear}.pdf`;
      triggerDownload(blob, filename);
      notify(`Bulletin généré et téléchargé — ${MONTHS[genMonth-1]} ${genYear}`);
      await loadPayslips();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setGenerating(false);
    }
  };

  // Génération groupée pour tous les employés
  const handleGenerateAll = async () => {
    if (!confirm(`Générer les bulletins de ${MONTHS[genMonth-1]} ${genYear} pour tous les employés ?`)) return;
    setGenerating(true);
    try {
      const result = await generateAllPayslips({ month: genMonth, year: genYear }, token);
      notify(result.message);
      await loadPayslips();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setGenerating(false);
    }
  };

  // Téléchargement d'un bulletin existant
  const handleDownload = async (payslip) => {
    try {
      const blob     = await downloadPayslip(payslip.id, token);
      const filename = `bulletin_${payslip.last_name}_${MONTHS[payslip.period_month-1]}_${payslip.period_year}.pdf`;
      triggerDownload(blob, filename);
    } catch (err) {
      notify(err.message, true);
    }
  };

  // Suppression
  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce bulletin ? Cette action est irréversible.')) return;
    try {
      await deletePayslip(id, token);
      setPayslips(prev => prev.filter(p => p.id !== id));
      notify('Bulletin supprimé.');
    } catch (err) {
      notify(err.message, true);
    }
  };

  // Stat : masse salariale du mois filtré
  const totalBrut = payslips.reduce((s, p) => s + parseFloat(p.gross_amount), 0);
  const totalNet  = payslips.reduce((s, p) => s + parseFloat(p.net_amount), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Gestion de la paie</h1>
          <p className="page-subtitle">Générez et téléchargez les bulletins de vos employés</p>
        </div>
      </div>

      {/* Notifications */}
      {error   && <div className="notif-bar" style={{ background:'#FCEBEB', borderColor:'#F09595', color:'#791F1F' }}>{error}</div>}
      {success && <div className="notif-bar" style={{ background:'#EAF3DE', borderColor:'#97C459', color:'#27500A' }}>{success}</div>}

      {/* Panneaux côte à côte */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Génération individuelle */}
        <div className="section-card">
          <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Générer un bulletin</h3>
          <form onSubmit={handleGenerate}>
            <div className="field">
              <label>Employé *</label>
              <select value={genUserId} onChange={e => setGenUserId(e.target.value)} required>
                <option value="">Sélectionner…</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                    {emp.gross_salary ? ` — ${Number(emp.gross_salary).toLocaleString('fr-FR')} € brut` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Mois *</label>
                <select value={genMonth} onChange={e => setGenMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Année *</label>
                <select value={genYear} onChange={e => setGenYear(Number(e.target.value))}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn-primary" disabled={generating} style={{ flex: 1 }}>
                {generating ? 'Génération…' : '⬇ Générer & télécharger'}
              </button>
            </div>
          </form>
        </div>

        {/* Génération groupée + stats */}
        <div className="section-card">
          <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Génération groupée</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Génère les bulletins de tous les employés actifs pour une période donnée.
            Les bulletins déjà existants sont ignorés.
          </p>
          <button className="btn-primary" onClick={handleGenerateAll} disabled={generating} style={{ width: '100%' }}>
            {generating ? 'Génération…' : `Générer tous — ${MONTHS[genMonth-1]} ${genYear}`}
          </button>

          {/* Stats masse salariale */}
          {payslips.length > 0 && (
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="metric-card">
                <div className="metric-label">Masse salariale brute</div>
                <div className="metric-value" style={{ fontSize: 16 }}>
                  {totalBrut.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} €
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Total net versé</div>
                <div className="metric-value" style={{ fontSize: 16 }}>
                  {totalNet.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} €
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filtres + liste */}
      <div className="section-header">
        <span className="section-title">Bulletins générés</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ fontSize: 13 }}>
            <option value="">Tous les mois</option>
            {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} style={{ fontSize: 13 }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="tab-loading">Chargement…</p>
      ) : payslips.length === 0 ? (
        <p className="empty-state">Aucun bulletin pour cette période.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employé</th>
                <th>Période</th>
                <th>Brut</th>
                <th>Net</th>
                <th>Cotisations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payslips.map(p => {
                const cotis = parseFloat(p.gross_amount) - parseFloat(p.net_amount);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="cell-emp">
                        <div className="avatar-xs">{p.first_name?.[0]}{p.last_name?.[0]}</div>
                        <div>
                          <div className="emp-name">{p.first_name} {p.last_name}</div>
                          <div className="emp-email">{p.job_title}</div>
                        </div>
                      </div>
                    </td>
                    <td>{MONTHS[p.period_month - 1]} {p.period_year}</td>
                    <td><strong>{Number(p.gross_amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong></td>
                    <td style={{ color: '#185FA5', fontWeight: 500 }}>
                      {Number(p.net_amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                      {cotis.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-primary btn-sm" onClick={() => handleDownload(p)}>
                          ⬇ PDF
                        </button>
                        <button
                          className="btn-ghost btn-sm"
                          style={{ color: 'var(--color-text-danger)' }}
                          onClick={() => handleDelete(p.id)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Note légale */}
      <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 16 }}>
        Les cotisations sont calculées avec des taux simplifiés à titre indicatif.
        Pour une paie conforme, utilisez un logiciel de paie agréé ou un expert-comptable.
      </p>
    </div>
  );
}
