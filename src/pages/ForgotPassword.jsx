import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword as apiForgotPassword } from '../api/auth';
import { LegalLinks } from './legal/LegalLayout';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiForgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="success-icon">✓</div>
          <h1>Email envoyé</h1>
          <p>Si un compte existe avec cette adresse, un lien de réinitialisation vient d'être envoyé. Vérifiez votre boîte mail (et vos spams).</p>
          <p className="auth-switch"><Link to="/login">Retour à la connexion</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Mot de passe oublié</h1>
        <p className="auth-subtitle">Indiquez votre email, nous vous envoyons un lien pour en choisir un nouveau.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Envoi…' : 'Envoyer le lien'}
          </button>
        </form>

        <p className="auth-switch"><Link to="/login">Retour à la connexion</Link></p>
        <LegalLinks />
      </div>
    </div>
  );
}
