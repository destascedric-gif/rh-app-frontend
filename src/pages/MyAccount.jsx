import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api/auth';
import PageHeader from '../components/PageHeader';

// « Mon compte » de l'employé (8 nov. 2026, demande de Cédric) : ses
// informations de connexion et le changement de mot de passe, comme sur la
// plupart des sites. Le mot de passe était avant sur la page d'accueil
// (Mon espace), où Cédric ne le voulait pas. Le nom et l'adresse e-mail
// sont seulement affichés : c'est le gérant qui les modifie (fiche employé).

const EMPTY_PASSWORD_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function MyAccount() {
  const { token, user } = useAuth();

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
          <div className="info-row">
            <span className="info-label">Nom</span>
            <span className="info-value">{user?.firstName} {user?.lastName}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Adresse e-mail</span>
            <span className="info-value">{user?.email}</span>
          </div>
          <p className="hint" style={{ marginTop: 12 }}>
            Une erreur dans votre nom ou votre adresse e-mail ? Demandez à votre responsable de la corriger.
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
