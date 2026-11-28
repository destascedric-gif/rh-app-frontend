import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin, loginCode as apiLoginCode } from '../api/auth';
import { LegalLinks } from './legal/LegalLayout';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  // Double authentification (compte propriétaire, 28 nov. 2026) : après le
  // mot de passe, code à 6 chiffres de l'application d'authentification
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const finish = (data) => {
    login(data.user, data.token);
    // Inscription laissée inachevée (compte créé mais entreprise jamais
    // renseignée) : on renvoie terminer l'étape 2 plutôt que de bloquer.
    if (data.user.role === 'owner') navigate('/pilotage');
    else if (!data.user.companyId) navigate('/setup/company');
    else if (data.user.role === 'admin') navigate('/dashboard');
    else navigate('/mon-espace');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiLogin(form);
      if (data.needCode) {
        setChallenge(data.challenge);
        setCode('');
        return;
      }
      finish(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      finish(await apiLoginCode({ challenge, code: code.replace(/\s/g, '') }));
    } catch (err) {
      setError(err.message);
      // Délai de 5 minutes dépassé : retour au mot de passe
      if (/depuis le début/.test(err.message)) setChallenge(null);
    } finally {
      setLoading(false);
    }
  };

  if (challenge) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Code de sécurité</h1>
          <p className="auth-subtitle">Ouvrez votre application d'authentification et tapez le code à 6 chiffres affiché pour Orgaly.</p>

          <form onSubmit={handleCode}>
            <div className="field">
              <label>Code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={7}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ''))}
                placeholder="123 456"
                autoFocus
                required
              />
            </div>

            {error && <p className="error-msg">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Vérification…' : 'Valider'}
            </button>
          </form>

          <p className="auth-switch">
            <Link to="/login" onClick={(e) => { e.preventDefault(); setChallenge(null); setError(''); }}>
              Retour
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Connexion</h1>
        <p className="auth-subtitle">Accédez à votre espace RH</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="votre@email.com"
              required
            />
          </div>

          <div className="field">
            <label>Mot de passe</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/mot-de-passe-oublie">Mot de passe oublié ?</Link>
        </p>
        <p className="auth-switch">
          Pas encore de compte ? <Link to="/setup/admin">Créer mon entreprise</Link>
        </p>
        <LegalLinks />
      </div>
    </div>
  );
}
