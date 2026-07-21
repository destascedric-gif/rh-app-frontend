import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEmployee, deactivateEmployee, reactivateEmployee } from '../api/employees';
import { resendInvite } from '../api/auth';
import ResumeTab    from '../components/tabs/ResumeTab';
import PayslipsTab  from '../components/tabs/PayslipsTab';
import DocumentsTab from '../components/tabs/DocumentsTab';
import TimesheetTab from '../components/tabs/TimesheetTab';
import MonthlySummaryTab from '../components/tabs/MonthlySummaryTab';

const TABS = [
  { key: 'resume',    label: 'Résumé général' },
  { key: 'summary',   label: 'Récap mensuel' },
  { key: 'payslips',  label: 'Bulletins de paie' },
  { key: 'documents', label: 'Documents' },
  { key: 'timesheet', label: 'Pointage' },
];

const Avatar = ({ firstName, lastName, photoUrl }) => {
  if (photoUrl) return <img src={photoUrl} alt="photo" className="avatar-lg" />;
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  return <div className="avatar-lg avatar-initials-lg">{initials}</div>;
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR') : '—';

export default function EmployeeDetail() {
  const { id }    = useParams();
  const { token } = useAuth();
  const navigate  = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('resume');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // 'deactivate' | 'reactivate'
  const [busy, setBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const load = async () => {
    try {
      const data = await getEmployee(id, token);
      setEmployee(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id, token]);

  const handleResend = async () => {
    setBusy(true);
    setActionMsg('');
    try {
      const result = await resendInvite(id, token);
      setActionMsg(result.emailSent === false
        ? "L'email n'a pas pu être envoyé."
        : 'Invitation renvoyée.');
    } catch (err) {
      setActionMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmAction = async () => {
    setBusy(true);
    try {
      if (confirmAction === 'deactivate') await deactivateEmployee(id, token);
      else await reactivateEmployee(id, token);
      setConfirmAction(null);
      await load();
    } catch (err) {
      setActionMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="page-loading">Chargement…</div>;
  if (error)   return <div className="page-error">{error}</div>;
  if (!employee) return null;

  const fullName = `${employee.first_name} ${employee.last_name}`;

  return (
    <div className="page">
      {/* Retour */}
      <button className="btn-ghost back-btn" onClick={() => navigate('/employees')}>
        ← Retour à la liste
      </button>

      {/* En-tête fiche */}
      <div className="employee-header">
        <Avatar
          firstName={employee.first_name}
          lastName={employee.last_name}
          photoUrl={employee.photo_url}
        />
        <div className="employee-header-info">
          <h1>{fullName}</h1>
          <p className="emp-job">{employee.job_title ?? 'Poste non défini'}</p>
          <div className="emp-meta">
            <span>{employee.email}</span>
            {employee.phone && <span>· {employee.phone}</span>}
            {employee.department && <span>· {employee.department}</span>}
          </div>
          <div className="emp-tags">
            {employee.contract_type && (
              <span className="tag">{employee.contract_type}</span>
            )}
            {employee.work_time && (
              <span className="tag">{employee.work_time}</span>
            )}
            <span className={`badge ${employee.is_active ? 'badge-active' : 'badge-inactive'}`}>
              {employee.is_active ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <button className="btn-secondary" onClick={() => navigate(`/employees/${id}/edit`)}>
            Modifier la fiche
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {!employee.invite_accepted && employee.is_active && (
              <button className="btn-ghost" disabled={busy} onClick={handleResend}>
                Renvoyer l'invitation
              </button>
            )}
            {employee.is_active ? (
              <button className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => setConfirmAction('deactivate')}>
                Désactiver
              </button>
            ) : (
              <button className="btn-ghost" onClick={() => setConfirmAction('reactivate')}>
                Réactiver
              </button>
            )}
          </div>
        </div>
      </div>

      {actionMsg && <p className="notif-bar">{actionMsg}</p>}

      {/* Onglets */}
      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="tab-content">
        {activeTab === 'resume'    && <ResumeTab    employee={employee} formatDate={formatDate} />}
        {activeTab === 'summary'   && <MonthlySummaryTab employeeId={id} />}
        {activeTab === 'payslips'  && <PayslipsTab  employeeId={id} />}
        {activeTab === 'documents' && <DocumentsTab employeeId={id} />}
        {activeTab === 'timesheet' && <TimesheetTab employeeId={id} />}
      </div>

      {confirmAction && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{confirmAction === 'deactivate' ? 'Désactiver cet employé ?' : 'Réactiver cet employé ?'}</h3>
            <p>
              <strong>{fullName}</strong>
              {confirmAction === 'deactivate'
                ? ' ne pourra plus se connecter à l\'application. Ses données sont conservées et il pourra être réactivé à tout moment.'
                : ' pourra de nouveau se connecter à l\'application.'}
            </p>
            <div className="form-actions">
              <button className="btn-ghost" onClick={() => setConfirmAction(null)} disabled={busy}>
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
