import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setupAdmin as apiSetupAdmin } from '../api/auth';

export default function SetupAdmin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      return setError('Le mot de passe doit faire au moins 8 caractères.');
    }
    setLoading(true);
    try {
      const data = await apiSetupAdmin(form);
      // On stocke le token temporaire pour l'étape 2
      login({ role: 'admin' }, data.token);
      navigate('/setup/company');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card wide">
        {/* Indicateur d'étapes */}
        <div className="steps">
          <div className="step active"><span>1</span> Mon compte</div>
          <div className="step"><span>2</span> Mon entreprise</div>
          <div className="step"><span>3</span> Mes employés</div>
        </div>

        <h1>Créez votre compte administrateur</h1>
        <p className="auth-subtitle">Ces informations vous permettront de gérer l'application.</p>

        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label>Prénom *</label>
              <input name="firstName" value={form.firstName}
                onChange={handleChange} placeholder="Jean" required />
            </div>
            <div className="field">
              <label>Nom *</label>
              <input name="lastName" value={form.lastName}
                onChange={handleChange} placeholder="Dupont" required />
            </div>
          </div>

          <div className="field">
            <label>Email *</label>
            <input type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="jean.dupont@entreprise.com" required />
          </div>

          <div className="field">
            <label>Mot de passe * <span className="hint">(8 caractères minimum)</span></label>
            <input type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="••••••••" required />
          </div>

          <div className="field">
            <label>Téléphone</label>
            <input name="phone" value={form.phone}
              onChange={handleChange} placeholder="+33 6 00 00 00 00" />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Création…' : 'Continuer →'}
          </button>
        </form>
      </div>
    </div>
  );
}
