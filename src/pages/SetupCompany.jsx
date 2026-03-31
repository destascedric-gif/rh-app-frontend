import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setupCompany as apiSetupCompany } from '../api/auth';

export default function SetupCompany() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [form, setForm] = useState({
    name: '', siret: '', address: '', city: '', postalCode: '', sector: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiSetupCompany(form, token);
      // Après setup entreprise, l'admin ajoute ses employés
      navigate('/setup/employees');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sectors = [
    'Commerce', 'BTP', 'Restauration', 'Santé', 'Informatique',
    'Industrie', 'Transport', 'Services', 'Éducation', 'Autre',
  ];

  return (
    <div className="auth-container">
      <div className="auth-card wide">
        <div className="steps">
          <div className="step done"><span>✓</span> Mon compte</div>
          <div className="step active"><span>2</span> Mon entreprise</div>
          <div className="step"><span>3</span> Mes employés</div>
        </div>

        <h1>Informations de votre entreprise</h1>
        <p className="auth-subtitle">Ces données apparaîtront sur les documents générés.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Raison sociale *</label>
            <input name="name" value={form.name}
              onChange={handleChange} placeholder="Ma Super Entreprise SAS" required />
          </div>

          <div className="field-row">
            <div className="field">
              <label>SIRET</label>
              <input name="siret" value={form.siret}
                onChange={handleChange} placeholder="12345678900012" maxLength={14} />
            </div>
            <div className="field">
              <label>Secteur d'activité</label>
              <select name="sector" value={form.sector} onChange={handleChange}>
                <option value="">Sélectionner…</option>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Adresse</label>
            <input name="address" value={form.address}
              onChange={handleChange} placeholder="12 rue de la Paix" />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Code postal</label>
              <input name="postalCode" value={form.postalCode}
                onChange={handleChange} placeholder="75001" maxLength={5} />
            </div>
            <div className="field">
              <label>Ville</label>
              <input name="city" value={form.city}
                onChange={handleChange} placeholder="Paris" />
            </div>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Enregistrement…' : 'Continuer →'}
          </button>
        </form>
      </div>
    </div>
  );
}
