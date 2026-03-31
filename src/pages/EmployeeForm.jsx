import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEmployee, updateEmployee } from '../api/employees';

const CONTRACT_TYPES = ['CDI', 'CDD', 'Alternance', 'Stage', 'Freelance'];
const WORK_TIMES = ['Temps plein', 'Temps partiel'];

export default function EmployeeForm() {
  const { id }    = useParams();
  const { token } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    jobTitle: '', department: '', contractType: '', workTime: '',
    hireDate: '', grossSalary: '', birthDate: '', socialSecurity: '',
  });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  useEffect(() => {
    getEmployee(id, token).then(emp => {
      setForm({
        firstName:      emp.first_name      ?? '',
        lastName:       emp.last_name       ?? '',
        email:          emp.email           ?? '',
        phone:          emp.phone           ?? '',
        jobTitle:       emp.job_title       ?? '',
        department:     emp.department      ?? '',
        contractType:   emp.contract_type   ?? '',
        workTime:       emp.work_time       ?? '',
        hireDate:       emp.hire_date?.slice(0,10) ?? '',
        grossSalary:    emp.gross_salary    ?? '',
        birthDate:      emp.birth_date?.slice(0,10) ?? '',
        socialSecurity: emp.social_security ?? '',
      });
    }).catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateEmployee(id, form, token);
      setSuccess('Fiche mise à jour avec succès !');
      setTimeout(() => navigate(`/employees/${id}`), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading">Chargement…</div>;

  return (
    <div className="page">
      <button className="btn-ghost btn-sm back-btn" onClick={() => navigate(`/employees/${id}`)}>
        ← Retour à la fiche
      </button>

      <div className="page-header">
        <div>
          <h1>Modifier la fiche</h1>
          <p className="page-subtitle">{form.firstName} {form.lastName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Informations personnelles */}
        <div className="section-card">
          <h3>Informations personnelles</h3>
          <div className="field-row">
            <div className="field">
              <label>Prénom</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} />
            </div>
            <div className="field">
              <label>Nom</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} />
            </div>
            <div className="field">
              <label>Téléphone</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="06 00 00 00 00" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Date de naissance</label>
              <input type="date" name="birthDate" value={form.birthDate} onChange={handleChange} />
            </div>
            <div className="field">
              <label>N° Sécurité sociale</label>
              <input name="socialSecurity" value={form.socialSecurity} onChange={handleChange} placeholder="1 85 05 75 116 001 42" />
            </div>
          </div>
        </div>

        {/* Informations professionnelles */}
        <div className="section-card">
          <h3>Informations professionnelles</h3>
          <div className="field-row">
            <div className="field">
              <label>Poste</label>
              <input name="jobTitle" value={form.jobTitle} onChange={handleChange} placeholder="Développeur, Commercial…" />
            </div>
            <div className="field">
              <label>Département</label>
              <input name="department" value={form.department} onChange={handleChange} placeholder="Tech, Vente…" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Type de contrat</label>
              <select name="contractType" value={form.contractType} onChange={handleChange}>
                <option value="">Sélectionner…</option>
                {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Temps de travail</label>
              <select name="workTime" value={form.workTime} onChange={handleChange}>
                <option value="">Sélectionner…</option>
                {WORK_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Date d'embauche</label>
              <input type="date" name="hireDate" value={form.hireDate} onChange={handleChange} />
            </div>
            <div className="field">
              <label>Salaire brut mensuel (€)</label>
              <input type="number" name="grossSalary" value={form.grossSalary} onChange={handleChange} placeholder="2500" />
            </div>
          </div>
        </div>

        {error   && <p className="error-msg">{error}</p>}
        {success && <p style={{ color: 'var(--success)', background: 'var(--success-bg)', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>{success}</p>}

        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={() => navigate(`/employees/${id}`)}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}