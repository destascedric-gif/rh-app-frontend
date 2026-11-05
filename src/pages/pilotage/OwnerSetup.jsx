import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { setupOwnerPassword } from '../../api/owner';
import BrandMark from '../../components/BrandMark';
import './Pilotage.css';

// Choix du mot de passe du compte propriétaire, depuis le lien reçu par
// e-mail (backend-propre/scripts/create-owner.js)
export default function OwnerSetup() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = 'Pilotage — Orgaly'; }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Les deux mots de passe ne sont pas identiques.');
      return;
    }
    setLoading(true);
    try {
      await setupOwnerPassword({ token, password });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pil pil-setup">
      <div className="pil-card pil-setup-card">
        <div className="pil-brand">
          <BrandMark size={26} color="#C9A75A" />
          <div className="pil-title">Pilotage Orgaly</div>
        </div>
        {done ? (
          <>
            <p className="pil-ok-msg" style={{ marginTop: 16 }}>Mot de passe enregistré.</p>
            <p className="pil-sub">Connectez-vous avec contact@myorgaly.fr : vous arriverez directement sur le pilotage.</p>
            <Link to="/login" className="pil-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>Se connecter</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="pil-sub" style={{ margin: 0 }}>
              Choisissez le mot de passe du compte propriétaire : au moins 12 caractères, avec une
              majuscule, un chiffre et un caractère spécial.
            </p>
            <label>
              Nouveau mot de passe
              <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            <label>
              Confirmer le mot de passe
              <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </label>
            {error && <p className="pil-error">{error}</p>}
            <button type="submit" className="pil-btn" disabled={loading || !token}>
              {loading ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
            </button>
            {!token && <p className="pil-error">Ce lien est incomplet : utilisez celui reçu par e-mail.</p>}
          </form>
        )}
      </div>
    </div>
  );
}
