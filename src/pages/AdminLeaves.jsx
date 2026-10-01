import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllRequests, reviewRequest, getAllBalances } from '../api/leaves';
import LeaveStatusBadge from '../components/leaves/LeaveStatusBadge';
import PageHeader from '../components/PageHeader';
import { notifyRequestsChanged } from '../utils/notifications';

const shortDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');
const days = (n) => `${Number(n)} j`;
const period = (r) => (r.start_date === r.end_date
  ? shortDate(r.start_date)
  : `${shortDate(r.start_date)} → ${shortDate(r.end_date)}`);

// Sous ce nombre de jours restants, la barre de solde passe en orange
const LOW_BALANCE_DAYS = 5;

const Avatar = ({ name }) => (
  <span className="dash-avatar dash-avatar--small">
    {name?.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)}
  </span>
);

export default function AdminLeaves() {
  const { token } = useAuth();

  const [showHistory, setShowHistory] = useState(false);
  const [requests,    setRequests]    = useState([]);
  const [balances,    setBalances]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [busyId,      setBusyId]      = useState(null);
  const [error,       setError]       = useState('');
  const [notice,      setNotice]      = useState('');

  // Refus : petite fenêtre pour un motif facultatif
  const [refusing,   setRefusing]   = useState(null);
  const [refuseNote, setRefuseNote] = useState('');

  const load = useCallback(async () => {
    try {
      const [reqs, bal] = await Promise.all([
        getAllRequests('', token),
        getAllBalances(token).catch(() => ({ balances: [] })),
      ]);
      setRequests(reqs);
      setBalances(bal.balances);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const decide = async (request, status, adminNote = '') => {
    setBusyId(request.id);
    setError('');
    setNotice('');
    try {
      const result = await reviewRequest(request.id, { status, adminNote }, token);
      notifyRequestsChanged();
      if (result.emailSent === false) setNotice("L'e-mail de notification n'a pas pu être envoyé à l'employé.");
      setRefusing(null);
      setRefuseNote('');
      await load(); // soldes et historique à jour
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="page-loading">Chargement…</div>;

  const pending   = requests.filter((r) => r.status === 'en_attente');
  const processed = requests.filter((r) => r.status !== 'en_attente');

  return (
    <div className="page">
      <PageHeader title="Congés et absences" />

      {notice && <div className="notif-bar">{notice}</div>}
      {error  && <div className="notif-bar notif-bar--danger">{error}</div>}

      <div className="dash-grid">
        {/* ── Demandes ─────────────────────────────── */}
        <section className="dash-card">
          <div className="dash-card-head">
            <h2>{showHistory ? `Demandes traitées (${processed.length})` : `Demandes en attente (${pending.length})`}</h2>
          </div>

          {!showHistory && (pending.length === 0 ? (
            <p className="dash-empty">Aucune demande en attente.</p>
          ) : (
            <ul className="dash-list">
              {pending.map((r) => (
                <li key={r.id} className="leave-row">
                  <Avatar name={r.employee_name} />
                  <div className="leave-row-main">
                    <div className="dash-row-name">{r.employee_name}</div>
                    <div className="dash-row-sub">
                      {r.leave_type} · {period(r)} · {days(r.working_days)}
                      {r.reason && <> · « {r.reason} »</>}
                    </div>
                  </div>
                  <div className="leave-row-actions">
                    <button type="button" className="btn-primary btn-sm" disabled={busyId === r.id} onClick={() => decide(r, 'approuvé')}>Valider</button>
                    <button type="button" className="btn-secondary btn-sm" disabled={busyId === r.id} onClick={() => { setRefusing(r); setRefuseNote(''); }}>Refuser</button>
                  </div>
                </li>
              ))}
            </ul>
          ))}

          {showHistory && (processed.length === 0 ? (
            <p className="dash-empty">Aucune demande traitée pour le moment.</p>
          ) : (
            <ul className="dash-list">
              {processed.map((r) => (
                <li key={r.id} className="leave-row">
                  <Avatar name={r.employee_name} />
                  <div className="leave-row-main">
                    <div className="dash-row-name">{r.employee_name}</div>
                    <div className="dash-row-sub">
                      {r.leave_type} · {period(r)} · {days(r.working_days)}
                      {r.reviewed_at && <> · traitée le {formatDate(r.reviewed_at)}</>}
                    </div>
                    {r.admin_note && <div className="dash-row-sub">Motif : {r.admin_note}</div>}
                  </div>
                  <LeaveStatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          ))}

          <button type="button" className="btn-ghost btn-sm dash-link" onClick={() => setShowHistory((v) => !v)}>
            {showHistory ? 'Revenir aux demandes en attente' : "Voir l'historique (approuvées, refusées)"}
          </button>
        </section>

        {/* ── Soldes ───────────────────────────────── */}
        <section className="dash-card">
          <div className="dash-card-head">
            <h2>Soldes de congés payés</h2>
          </div>
          {balances.length === 0 ? (
            <p className="dash-empty">Aucun employé actif.</p>
          ) : (
            <ul className="dash-list">
              {balances.map((b) => {
                const remaining = Math.max(0, b.balance_days - b.used_days);
                const pct = b.balance_days > 0 ? Math.min(100, (remaining / b.balance_days) * 100) : 0;
                return (
                  <li key={b.employee_id} className="balance-row">
                    <div className="balance-row-head">
                      <span className="dash-row-name">{b.employee_name}</span>
                      <span className="dash-row-sub">
                        {b.has_hire_date
                          ? `${remaining.toLocaleString('fr-FR')} j restants sur ${Number(b.balance_days).toLocaleString('fr-FR')}`
                          : "Date d'embauche manquante"}
                      </span>
                    </div>
                    <div className="usage-meter" role="progressbar" aria-label={`Solde de ${b.employee_name}`} aria-valuemin={0} aria-valuemax={b.balance_days} aria-valuenow={remaining}>
                      <div className={`usage-meter-fill${remaining < LOW_BALANCE_DAYS ? ' full' : ''}`} style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Refus : motif facultatif envoyé à l'employé */}
      {refusing && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Refuser la demande</h3>
            <p>
              <strong>{refusing.employee_name}</strong> — {refusing.leave_type}, {period(refusing)} ({days(refusing.working_days)})
            </p>
            <div className="field">
              <label htmlFor="refuse-note">Motif pour l'employé <span className="hint">(facultatif)</span></label>
              <textarea id="refuse-note" rows={3} value={refuseNote} onChange={(e) => setRefuseNote(e.target.value)} placeholder="Ex. : période déjà très demandée" />
            </div>
            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={() => setRefusing(null)} disabled={busyId === refusing.id}>Annuler</button>
              <button type="button" className="btn-primary" onClick={() => decide(refusing, 'refusé', refuseNote)} disabled={busyId === refusing.id}>
                {busyId === refusing.id ? 'Enregistrement…' : 'Refuser la demande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
