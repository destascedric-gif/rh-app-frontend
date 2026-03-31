import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { acceptInvite as apiAcceptInvite } from '../api/auth';

export default function AcceptInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const token = searchParams.get('token');

  const [form, setForm]       = useState({ password: '', confirm: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError('Lien d\'invitation invalide. Contactez votre administrateur.');
  }, [token]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      return setError('Le mot de passe doit faire au moins 8 caractères.');
    }
    if (form.password !== form.confirm) {
      return setError('Les mots de passe ne correspondent pas.');
    }

    setLoading(true);
    try {
      const data = await apiAcceptInvite({ token, password: form.password });
      login(data.user, data.token);
      setSuccess(true);
      setTimeout(() => navigate('/mon-espace'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="success-icon">✓</div>
          <h1>Mot de passe créé !</h1>
          <p>Redirection vers votre espace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Bienvenue !</h1>
        <p className="auth-subtitle">Créez votre mot de passe pour accéder à votre espace RH.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Mot de passe * <span className="hint">(8 caractères minimum)</span></label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="field">
            <label>Confirmer le mot de passe *</label>
            <input
              type="password"
              name="confirm"
              value={form.confirm}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button
            type="submit"
            disabled={loading || !token}
            className="btn-primary"
          >
            {loading ? 'Création…' : 'Créer mon mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
