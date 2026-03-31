import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { inviteEmployee } from '../api/auth';

export default function InviteEmployee() {
  const { token } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', jobTitle: '' });
  const [msg, setMsg]   = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await inviteEmployee(form, token);
      setMsg(`Invitation envoyée à ${form.email} !`);
      setForm({ firstName: '', lastName: '', email: '', jobTitle: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Ajouter un employé</h1>
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
        {error && <p className="error-msg">{error}</p>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Envoi…' : 'Envoyer l\'invitation'}
        </button>
      </form>
    </div>
  );
}