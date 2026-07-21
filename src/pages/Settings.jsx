import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSettings, updateSettings } from '../api/settings';
import { changePassword } from '../api/auth';

const EMPTY_PASSWORD_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function Settings() {
  const { token } = useAuth();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [pwForm, setPwForm] = useState(EMPTY_PASSWORD_FORM);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  useEffect(() => {
    getSettings(token).then((data) => {
      setForm({
        defaultWeeklyHours:          data.default_weekly_hours,
        leaveAccrualPerMonth:        data.leave_accrual_per_month,
        overtimeTier1Rate:           data.overtime_tier1_rate,
        overtimeTier2Rate:           data.overtime_tier2_rate,
        overtimeTier2ThresholdHours: data.overtime_tier2_threshold_hours,
        primaryColor:                data.primary_color,
      });
    }).catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleColorPreview = (value) => {
    handleChange('primaryColor', value);
    document.documentElement.style.setProperty('--primary', value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateSettings(form, token);
      setSuccess('Paramètres enregistrés.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

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
      setPwSuccess('Mot de passe modifié avec succès.');
      setPwForm(EMPTY_PASSWORD_FORM);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  if (loading || !form) return <div className="page-loading">Chargement…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Paramètres</h1>
          <p className="page-subtitle">Politique RH et personnalisation de l'espace.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="section-card">
          <h3>Politique légale</h3>
          <div className="field-row">
            <div className="field">
              <label>Durée hebdomadaire par défaut (h)</label>
              <input
                type="number" step="0.5" min="0" max="60"
                value={form.defaultWeeklyHours}
                onChange={(e) => handleChange('defaultWeeklyHours', e.target.value)}
              />
              <span className="hint">Appliquée aux nouveaux employés (35h ou 39h en général).</span>
            </div>
            <div className="field">
              <label>Acquisition congés payés (jours / mois)</label>
              <input
                type="number" step="0.1" min="0" max="5"
                value={form.leaveAccrualPerMonth}
                onChange={(e) => handleChange('leaveAccrualPerMonth', e.target.value)}
              />
              <span className="hint">2,5 j/mois = 30 j/an, règle légale française par défaut.</span>
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Majoration heures sup — palier 1</label>
              <input
                type="number" step="0.05" min="1" max="3"
                value={form.overtimeTier1Rate}
                onChange={(e) => handleChange('overtimeTier1Rate', e.target.value)}
              />
              <span className="hint">Ex : 1.25 pour +25 %.</span>
            </div>
            <div className="field">
              <label>Majoration heures sup — palier 2</label>
              <input
                type="number" step="0.05" min="1" max="3"
                value={form.overtimeTier2Rate}
                onChange={(e) => handleChange('overtimeTier2Rate', e.target.value)}
              />
              <span className="hint">Ex : 1.50 pour +50 %.</span>
            </div>
            <div className="field">
              <label>Seuil hebdo du palier 2 (h)</label>
              <input
                type="number" step="0.5" min="35" max="60"
                value={form.overtimeTier2ThresholdHours}
                onChange={(e) => handleChange('overtimeTier2ThresholdHours', e.target.value)}
              />
              <span className="hint">Au-delà de ce seuil hebdo, la majoration passe au palier 2.</span>
            </div>
          </div>
        </div>

        <div className="section-card">
          <h3>Personnalisation</h3>
          <div className="field-row">
            <div className="field">
              <label>Couleur principale</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => handleColorPreview(e.target.value)}
                  style={{ width: 44, height: 34, padding: 2, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={(e) => handleColorPreview(e.target.value)}
                  style={{ width: 100 }}
                />
              </div>
              <span className="hint">Utilisée pour les boutons, le menu et les accents du site.</span>
            </div>
          </div>
        </div>

        {error && <p className="error-msg">{error}</p>}
        {success && <p style={{ color: 'var(--success)', background: 'var(--success-bg)', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>{success}</p>}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}
          </button>
        </div>
      </form>

      <form onSubmit={handlePasswordSubmit}>
        <div className="section-card">
          <h3>Sécurité</h3>
          <div className="field-row">
            <div className="field">
              <label>Mot de passe actuel</label>
              <input
                type="password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Nouveau mot de passe</label>
              <input
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                required
              />
              <span className="hint">8 caractères minimum.</span>
            </div>
            <div className="field">
              <label>Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                required
              />
            </div>
          </div>

          {pwError && <p className="error-msg">{pwError}</p>}
          {pwSuccess && <p style={{ color: 'var(--success)', background: 'var(--success-bg)', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>{pwSuccess}</p>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={pwSaving}>
              {pwSaving ? 'Enregistrement…' : 'Changer le mot de passe'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
