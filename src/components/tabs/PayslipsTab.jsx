import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPayslips } from '../../api/employees';

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

export default function PayslipsTab({ employeeId }) {
  const { token } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getPayslips(employeeId, token)
      .then(setPayslips)
      .finally(() => setLoading(false));
  }, [employeeId, token]);

  if (loading) return <p className="tab-loading">Chargement…</p>;

  if (payslips.length === 0) {
    return (
      <div className="empty-state">
        <p>Aucun bulletin de paie enregistré.</p>
      </div>
    );
  }

  return (
    <div className="payslips-tab">
      <table className="rh-table">
        <thead>
          <tr>
            <th>Période</th>
            <th>Salaire brut</th>
            <th>Salaire net</th>
            <th>Bulletin</th>
          </tr>
        </thead>
        <tbody>
          {payslips.map((p) => (
            <tr key={p.id}>
              <td>{MONTHS[p.period_month - 1]} {p.period_year}</td>
              <td>{Number(p.gross_amount).toLocaleString('fr-FR')} €</td>
              <td>{Number(p.net_amount).toLocaleString('fr-FR')} €</td>
              <td>
                {p.file_url ? (
                  <a href={p.file_url} target="_blank" rel="noreferrer" className="btn-ghost">
                    Télécharger PDF
                  </a>
                ) : (
                  <span className="text-muted">Non disponible</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
