import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEmployees } from '../api/employees';

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

  useEffect(() => {
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
    load();
  }, [token]);

  const filtered = employees.filter((e) => {
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

      <input
        className="search-input"
        placeholder="Rechercher par nom, poste, email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

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
                    <button
                      className="btn-ghost"
                      onClick={(e) => { e.stopPropagation(); navigate(`/employees/${emp.id}`); }}
                    >
                      Voir →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}