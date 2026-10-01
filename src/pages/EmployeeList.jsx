import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEmployees, deactivateEmployee, reactivateEmployee } from '../api/employees';
import { resendInvite } from '../api/auth';
import PageHeader from '../components/PageHeader';

const Avatar = ({ firstName, lastName, photoUrl }) => {
  if (photoUrl) {
    return <img src={photoUrl} alt="photo" className="avatar-img" />;
  }
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  return <div className="avatar-initials">{initials}</div>;
};

// Seuls les cas à signaler ont un badge (un employé actif n'en a pas besoin)
const StatusBadge = ({ inviteAccepted, isActive }) => {
  if (!isActive)       return <span className="badge badge-inactive">Inactif</span>;
  if (!inviteAccepted) return <span className="badge badge-pending">Invitation en attente</span>;
  return null;
};

const CONTRACTS = ['CDI', 'CDD', 'Alternance', 'Stage', 'Freelance'];

export default function EmployeeList() {
  const { token } = useAuth();
  const navigate  = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [contractFilter, setContractFilter] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null); // { employee, action: 'deactivate' | 'reactivate' }
  const [actionMsg, setActionMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const data = await getEmployees(token);
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [token]);

  const handleResend = async (emp) => {
    setBusy(true);
    setActionMsg('');
    try {
      const result = await resendInvite(emp.id, token);
      setActionMsg(result.emailSent === false
        ? `L'email n'a pas pu être envoyé à ${emp.email}.`
        : `Invitation renvoyée à ${emp.email}.`);
    } catch (err) {
      setActionMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmTarget) return;
    setBusy(true);
    try {
      if (confirmTarget.action === 'deactivate') {
        await deactivateEmployee(confirmTarget.employee.id, token);
      } else {
        await reactivateEmployee(confirmTarget.employee.id, token);
      }
      setConfirmTarget(null);
      await load();
    } catch (err) {
      setActionMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const visible = (showInactive ? employees : employees.filter((e) => e.is_active))
    .filter((e) => !contractFilter || e.contract_type === contractFilter);

  const filtered = visible.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.first_name.toLowerCase().includes(q) ||
      e.last_name.toLowerCase().includes(q)  ||
      e.email.toLowerCase().includes(q)      ||
      (e.job_title ?? '').toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="page-loading">Chargement…</div>;
  if (error)   return <div className="page-error">{error}</div>;

  return (
    <div className="page">
      <PageHeader
        title="Équipe"
        actions={<button className="btn-primary" onClick={() => navigate('/invite')}>+ Ajouter un employé</button>}
      />

      <div className="team-filters">
        <input
          className="search-input"
          placeholder="Rechercher un employé…"
          aria-label="Rechercher un employé"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={contractFilter} onChange={(e) => setContractFilter(e.target.value)} aria-label="Filtrer par contrat">
          <option value="">Tous les contrats</option>
          {CONTRACTS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className="team-inactive-toggle">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Voir les inactifs
        </label>
      </div>

      {actionMsg && <p className="notif-bar">{actionMsg}</p>}

      {filtered.length === 0 ? (
        <p className="empty-state">Aucun employé trouvé.</p>
      ) : (
        <ul className="team-grid">
          {filtered.map((emp) => (
            <li key={emp.id} className={`team-card${emp.is_active ? '' : ' team-card--inactive'}`}>
              <button type="button" className="team-card-main" onClick={() => navigate(`/employees/${emp.id}`)}>
                <Avatar firstName={emp.first_name} lastName={emp.last_name} photoUrl={emp.photo_url} />
                <span className="team-card-id">
                  <span className="team-card-name">{emp.first_name} {emp.last_name}</span>
                  <span className="team-card-job">{emp.job_title ?? 'Poste non défini'}</span>
                </span>
              </button>
              <div className="team-card-tags">
                {emp.contract_type && <span className={`team-tag${emp.contract_type === 'CDI' ? ' team-tag--blue' : ''}`}>{emp.contract_type}</span>}
                {emp.work_time && <span className="team-tag">{emp.work_time}</span>}
                <StatusBadge inviteAccepted={emp.invite_accepted} isActive={emp.is_active} />
              </div>
              <div className="team-card-actions">
                {!emp.invite_accepted && emp.is_active && (
                  <button className="btn-ghost btn-sm" disabled={busy} onClick={() => handleResend(emp)}>
                    Renvoyer l'invitation
                  </button>
                )}
                {emp.is_active ? (
                  <button className="btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setConfirmTarget({ employee: emp, action: 'deactivate' })}>
                    Désactiver
                  </button>
                ) : (
                  <button className="btn-ghost btn-sm" onClick={() => setConfirmTarget({ employee: emp, action: 'reactivate' })}>
                    Réactiver
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {confirmTarget && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{confirmTarget.action === 'deactivate' ? 'Désactiver cet employé ?' : 'Réactiver cet employé ?'}</h3>
            <p>
              <strong>{confirmTarget.employee.first_name} {confirmTarget.employee.last_name}</strong>
              {confirmTarget.action === 'deactivate'
                ? ' ne pourra plus se connecter à l\'application. Ses données (bulletins, pointage, documents) sont conservées et il pourra être réactivé à tout moment.'
                : ' pourra de nouveau se connecter à l\'application.'}
            </p>
            <div className="form-actions">
              <button className="btn-ghost" onClick={() => setConfirmTarget(null)} disabled={busy}>
                Annuler
              </button>
              <button className="btn-primary" onClick={handleConfirmAction} disabled={busy}>
                {busy ? 'Enregistrement…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}