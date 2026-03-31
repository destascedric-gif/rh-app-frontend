import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllRequests, reviewRequest } from '../api/leaves';
import LeaveStatusBadge from '../components/leaves/LeaveStatusBadge';

const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');

// Mini avatar initiales
const Avatar = ({ name, photoUrl }) => {
  if (photoUrl) return <img src={photoUrl} alt="" className="avatar-sm" />;
  const initials = name?.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
  return <div className="avatar-sm avatar-initials">{initials}</div>;
};

export default function AdminLeaves() {
  const { token } = useAuth();

  const [filter,   setFilter]   = useState('en_attente'); // filtre actif
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Modal de décision
  const [selected,   setSelected]   = useState(null);
  const [decision,   setDecision]   = useState('');  // 'approuvé' | 'refusé'
  const [adminNote,  setAdminNote]  = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  const load = async (status) => {
    setLoading(true);
    try {
      const data = await getAllRequests(status || '', token);
      setRequests(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(filter); }, [filter, token]);

  const handleReview = async () => {
    if (!decision) return;
    setSubmitting(true);
    setError('');
    try {
      await reviewRequest(selected.id, { status: decision, adminNote }, token);
      setSelected(null);
      setAdminNote('');
      setDecision('');
      await load(filter);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'en_attente').length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Congés & absences</h1>
          <p className="page-subtitle">
            {filter === 'en_attente' && pendingCount > 0
              ? `${pendingCount} demande(s) en attente de décision`
              : `${requests.length} demande(s)`}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="filter-tabs">
        {[
          { key: 'en_attente', label: '🕐 En attente' },
          { key: 'approuvé',   label: '✅ Approuvées' },
          { key: 'refusé',     label: '❌ Refusées'   },
          { key: '',           label: '📋 Tout'        },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`tab-btn ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tableau */}
      {loading ? (
        <p className="tab-loading">Chargement…</p>
      ) : requests.length === 0 ? (
        <p className="empty-state">Aucune demande dans cette catégorie.</p>
      ) : (
        <table className="rh-table">
          <thead>
            <tr>
              <th>Employé</th>
              <th>Type</th>
              <th>Du</th>
              <th>Au</th>
              <th>Jours</th>
              <th>Motif</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="cell-employee">
                    <Avatar name={r.employee_name} photoUrl={r.photo_url} />
                    <div>
                      <div className="emp-name">{r.employee_name}</div>
                      <div className="emp-email">{r.job_title}</div>
                    </div>
                  </div>
                </td>
                <td>{r.leave_type}</td>
                <td>{formatDate(r.start_date)}</td>
                <td>{formatDate(r.end_date)}</td>
                <td><strong>{r.working_days} j</strong></td>
                <td className="text-muted">{r.reason || '—'}</td>
                <td><LeaveStatusBadge status={r.status} /></td>
                <td>
                  {r.status === 'en_attente' ? (
                    <button
                      className="btn-primary small"
                      onClick={() => { setSelected(r); setDecision(''); setAdminNote(''); }}
                    >
                      Traiter
                    </button>
                  ) : (
                    <span className="text-muted">
                      {r.reviewed_at ? formatDate(r.reviewed_at) : '—'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal de décision */}
      {selected && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Traiter la demande</h3>
            <p>
              <strong>{selected.employee_name}</strong> — {selected.leave_type}<br />
              Du <strong>{formatDate(selected.start_date)}</strong> au <strong>{formatDate(selected.end_date)}</strong>
              {' '}({selected.working_days} jour(s) ouvré(s))
            </p>
            {selected.reason && (
              <p className="text-muted">Motif employé : {selected.reason}</p>
            )}

            {/* Choix de la décision */}
            <div className="decision-btns">
              <button
                className={`btn-decision ${decision === 'approuvé' ? 'selected-approve' : ''}`}
                onClick={() => setDecision('approuvé')}
              >
                ✅ Approuver
              </button>
              <button
                className={`btn-decision ${decision === 'refusé' ? 'selected-refuse' : ''}`}
                onClick={() => setDecision('refusé')}
              >
                ❌ Refuser
              </button>
            </div>

            <div className="field" style={{ marginTop: '1rem' }}>
              <label>Note pour l'employé <span className="hint">(optionnel)</span></label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                placeholder={decision === 'refusé' ? 'Expliquer le motif du refus…' : 'Message optionnel…'}
              />
            </div>

            {error && <p className="error-msg">{error}</p>}

            <div className="form-actions">
              <button
                className="btn-ghost"
                onClick={() => setSelected(null)}
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                className="btn-primary"
                onClick={handleReview}
                disabled={!decision || submitting}
              >
                {submitting ? 'Enregistrement…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
