// Onglet "Résumé général" — affiche toutes les infos personnelles et pro

const maskSSN = (ssn) => {
  if (!ssn) return '—';
  // Masque tout sauf les 4 derniers chiffres
  return '•'.repeat(ssn.length - 4) + ssn.slice(-4);
};

const InfoRow = ({ label, value }) => (
  <div className="info-row">
    <span className="info-label">{label}</span>
    <span className="info-value">{value || '—'}</span>
  </div>
);

export default function ResumeTab({ employee, formatDate }) {
  return (
    <div className="resume-tab">
      {/* Informations personnelles */}
      <section className="info-section">
        <h2>Informations personnelles</h2>
        <div className="info-grid">
          <InfoRow label="Prénom"              value={employee.first_name} />
          <InfoRow label="Nom"                 value={employee.last_name} />
          <InfoRow label="Email"               value={employee.email} />
          <InfoRow label="Téléphone"           value={employee.phone} />
          <InfoRow label="Date de naissance"   value={formatDate(employee.birth_date)} />
          <InfoRow label="N° Sécurité sociale" value={maskSSN(employee.social_security)} />
        </div>
      </section>

      {/* Informations professionnelles */}
      <section className="info-section">
        <h2>Informations professionnelles</h2>
        <div className="info-grid">
          <InfoRow label="Poste"           value={employee.job_title} />
          <InfoRow label="Département"     value={employee.department} />
          <InfoRow label="Type de contrat" value={employee.contract_type} />
          <InfoRow label="Temps de travail" value={employee.work_time} />
          <InfoRow label="Date d'embauche" value={formatDate(employee.hire_date)} />
          <InfoRow
            label="Salaire brut"
            value={
              employee.gross_salary
                ? `${Number(employee.gross_salary).toLocaleString('fr-FR')} € / mois`
                : null
            }
          />
        </div>
      </section>

      {/* Pied de fiche */}
      <section className="info-section">
        <h2>Informations système</h2>
        <div className="info-grid">
          <InfoRow label="Compte créé le"  value={formatDate(employee.created_at)} />
          <InfoRow label="Invitation"      value={employee.invite_accepted ? 'Acceptée' : 'En attente'} />
          <InfoRow label="Statut"          value={employee.is_active ? 'Actif' : 'Inactif'} />
        </div>
      </section>
    </div>
  );
}
