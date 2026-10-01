import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { inviteEmployee } from '../api/auth';
import PageHeader from '../components/PageHeader';

export default function InviteEmployee() {
  const { token } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', jobTitle: '' });
  const [msg, setMsg]   = useState('');
  const [error, setError] = useState('');
  const [planLimit, setPlanLimit] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPlanLimit(false);
    try {
      const result = await inviteEmployee(form, token);
      setMsg(result.emailSent === false
        ? `Employé créé, mais l'email n'a pas pu être envoyé. Vous pourrez le renvoyer depuis sa fiche.`
        : `Invitation envoyée à ${form.email} !`);
      setForm({ firstName: '', lastName: '', email: '', jobTitle: '' });
    } catch (err) {
      setError(err.message);
      setPlanLimit(err.code === 'PLAN_LIMIT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <PageHeader title="Ajouter un employé" />
      <form onSubmit={handleSubmit}>
        <div className="field"><label>Prénom *</label>
          <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required /></div>
        <div className="field"><label>Nom *</label>
          <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required /></div>
        <div className="field"><label>Email *</label>
          <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
        <div className="field"><label>Poste</label>
          <input value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})} /></div>
        {msg && <p style={{color:'green'}}>{msg}</p>}
        {error && (
          <p className="error-msg">
            {error}
            {planLimit && <> <Link to="/abonnement">Voir les offres →</Link></>}
          </p>
        )}
        <div style={{display:'flex', gap:'12px', marginTop:'1rem'}}>
          <button type="button" className="btn-ghost" onClick={() => navigate('/employees')}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Envoi…' : "Envoyer l'invitation"}
          </button>
        </div>
      </form>
    </div>
  );
}