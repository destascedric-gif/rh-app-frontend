import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api/auth';
import { getMyProfile } from '../api/employees';
import PageHeader from '../components/PageHeader';

// « Mon compte » de l'employé (8 nov. 2026, demande de Cédric) : ses
// informations de connexion et le changement de mot de passe, comme sur la
// plupart des sites. Le mot de passe était avant sur la page d'accueil
// (Mon espace), où Cédric ne le voulait pas. Les informations (identité,
// contrat) sont seulement affichées, sans le salaire : c'est le gérant qui
// les modifie (fiche employé). Source : GET /api/employees/me.

const EMPTY_PASSWORD_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

const frDate = (d) => (d
  ? new Date(String(d).slice(0, 10) + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  : '');
const hoursLabel = (h) => (h ? `${String(Number(h)).replace('.', ',')} h par semaine` : '');

// Une ligne « libellé : valeur » ; valeur vide → « Non renseigné », pour
// que l'employé sache ce qui manque et puisse le signaler au gérant.
function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      {value
        ? <span className="info-value">{value}</span>
        : <span className="info-value" style={{ color: 'var(--text-light)', fontWeight: 400 }}>Non renseigné</span>}
    </div>
  );
}

export default function MyAccount() {
  const { token, user } = useAuth();

  // Fiche complète (téléphone, contrat…) ; en attendant, ce que contient
  // déjà la session (nom, e-mail).
  const [profile, setProfile]       = useState(null);
  const [profileError, setProfileError] = useState('');
  useEffect(() => {
    getMyProfile(token).then(setProfile).catch((err) => setProfileError(err.message));
  }, [token]);
  const p = profile ?? { first_name: user?.firstName, last_name: user?.lastName, email: user?.email };

  const [pwForm, setPwForm]     = useState(EMPTY_PASSWORD_FORM);
  const [pwError, setPwError]   = useState('');
  const [pwNotice, setPwNotice] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwNotice('');

    if (pwForm.newPassword.length < 8) {
      setPwError('Le nouveau mot de passe doit faire au moins 8 caractères.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }

    setPwSaving(true);
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }, token);
      setPwForm(EMPTY_PASSWORD_FORM);
      setPwNotice('Mot de passe modifié.');
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="page">
      <PageHeader title="Mon compte" />

      <div className="dash-grid">
        <section className="dash-card">
          <div className="dash-card-head">
            <h2>Mes informations</h2>
          </div>
          <InfoRow label="Nom" value={[p.first_name, p.last_name].filter(Boolean).join(' ')} />
          <InfoRow label="Adresse e-mail" value={p.email} />
          <InfoRow label="Téléphone" value={p.phone} />
          <InfoRow label="Date de naissance" value={frDate(p.birth_date)} />

          <h3 className="myaccount-subtitle">Mon contrat</h3>
          <InfoRow label="Poste" value={p.job_title} />
          <InfoRow label="Service" value={p.department} />
          <InfoRow label="Type de contrat" value={p.contract_type} />
          <InfoRow label="Temps de travail" value={p.work_time} />
          <InfoRow label="Heures prévues" value={hoursLabel(p.weekly_hours)} />
          <InfoRow label="Date d'entrée" value={frDate(p.hire_date)} />

          {profileError && <p className="error-msg">{profileError}</p>}
          <p className="hint" style={{ marginTop: 12 }}>
            Une information manquante ou erronée ? Demandez à votre responsable de la corriger.
          </p>
        </section>

        <section className="dash-card">
          <div className="dash-card-head">
            <h2>Mot de passe</h2>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div className="field">
              <label>Mot de passe actuel</label>
              <input
                type="password" autoComplete="current-password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label>Nouveau mot de passe</label>
              <input
                type="password" autoComplete="new-password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                required
              />
              <span className="hint">8 caractères minimum.</span>
            </div>
            <div className="field">
              <label>Confirmer le nouveau mot de passe</label>
              <input
                type="password" autoComplete="new-password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                required
              />
            </div>

            {pwError && <p className="error-msg">{pwError}</p>}
            {pwNotice && <p className="notif-bar notif-bar--success">{pwNotice}</p>}

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={pwSaving}>
                {pwSaving ? 'Enregistrement…' : 'Changer le mot de passe'}
              </button>
            </div>
          </form>

          <p className="hint" style={{ marginTop: 14 }}>
            Mot de passe actuel oublié ?{' '}
            <Link to="/mot-de-passe-oublie">Recevoir un lien par e-mail</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
