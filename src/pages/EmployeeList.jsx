import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEmployees, deactivateEmployee, reactivateEmployee } from '../api/employees';
import { resendInvite } from '../api/auth';

const Avatar = ({ firstName, lastName, photoUrl }) => {
  if (photoUrl) {
    return <img src={photoUrl} alt="photo" className="avatar-img" />;
  }
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  return <div className="avatar-initials">{initials}</div>;
};

const StatusBadge = ({ inviteAccepted, isActive }) => {
  if (!isActive)       return <span className="badge badge-inactive">Inactif</span>;
  if (!inviteAccepted) return <span className="badge badge-pending">En attente</span>;
  return <span className="badge badge-active">Actif</span>;
};

export default function EmployeeList() {
  const { token } = useAuth();
  const navigate  = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [showInactive, setShowInactive] = useState(false);
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

  const visible = showInactive ? employees : employees.filter((e) => e.is_active);

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
      <div className="page-header">
        <div>
          <h1>Employés</h1>
          <p className="page-subtitle">{employees.length} membre{employees.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/invite')}>
          + Ajouter un employé
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <input
          className="search-input"
          style={{ flex: 1, marginBottom: 0 }}
          placeholder="Rechercher par nom, poste, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Voir les employés inactifs
        </label>
      </div>

      {actionMsg && <p className="notif-bar">{actionMsg}</p>}

      {filtered.length === 0 ? (
        <p className="empty-state">Aucun employé trouvé.</p>
      ) : (
        <div className="table-wrapper">
          <table className="rh-table">
            <thead>
              <tr>
                <th>Employé</th>
                <th>Poste</th>
                <th>Contrat</th>
                <th>Temps</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} onClick={() => navigate(`/employees/${emp.id}`)} className="table-row-clickable">
                  <td>
                    <div className="cell-employee">
                      <Avatar firstName={emp.first_name} lastName={emp.last_name} photoUrl={emp.photo_url} />
                      <div>
                        <div className="emp-name">{emp.first_name} {emp.last_name}</div>
                        <div className="emp-email">{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{emp.job_title ?? '—'}</td>
                  <td>{emp.contract_type ?? '—'}</td>
                  <td>{emp.work_time ?? '—'}</td>
                  <td>
                    <StatusBadge
                      inviteAccepted={emp.invite_accepted}
                      isActive={emp.is_active}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      {!emp.invite_accepted && emp.is_active && (
                        <button
                          className="btn-ghost"
                          disabled={busy}
                          onClick={(e) => { e.stopPropagation(); handleResend(emp); }}
                        >
                          Renvoyer l'invitation
                        </button>
                      )}
                      {emp.is_active ? (
                        <button
                          className="btn-ghost"
                          style={{ color: 'var(--danger)' }}
                          onClick={(e) => { e.stopPropagation(); setConfirmTarget({ employee: emp, action: 'deactivate' }); }}
                        >
                          Désactiver
                        </button>
                      ) : (
                        <button
                          className="btn-ghost"
                          onClick={(e) => { e.stopPropagation(); setConfirmTarget({ employee: emp, action: 'reactivate' }); }}
                        >
                          Réactiver
                        </button>
                      )}
                      <button
                        className="btn-ghost"
                        onClick={(e) => { e.stopPropagation(); navigate(`/employees/${emp.id}`); }}
                      >
                        Voir →
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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