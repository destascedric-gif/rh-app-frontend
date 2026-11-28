import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOwner2fa, startOwner2fa, enableOwner2fa, disableOwner2fa } from '../../api/owner';
import { PageHead, Icon } from './PilotageUi';
import { fmtLongDate } from './pilotageUtils';

// Sécurité du compte propriétaire (28 nov. 2026, suite de l'audit) : double
// authentification. Une fois active, la connexion au pilotage demande, après
// le mot de passe, le code à 6 chiffres d'une application d'authentification
// sur le téléphone (la même que pour Stripe convient).
const codeInput = (value, onChange) => (
  <span className="pil-input-usd" style={{ maxWidth: 150 }}>
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={7}
      placeholder="123 456"
      aria-label="Code à 6 chiffres"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^\d ]/g, ''))}
    />
  </span>
);

export default function PilSecurite() {
  const { token } = useAuth();
  const [status, setStatus] = useState(null); // { enabled, enabledAt }
  const [setup, setSetup] = useState(null);   // { qrSvg, secret }
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [disabling, setDisabling] = useState(false);

  useEffect(() => {
    getOwner2fa(token).then(setStatus).catch((e) => setError(e.message));
  }, [token]);

  const run = async (fn) => {
    setBusy(true); setError(''); setNotice('');
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const start = () => run(async () => { setSetup(await startOwner2fa(token)); setCode(''); });
  const confirm = (e) => {
    e.preventDefault();
    run(async () => {
      await enableOwner2fa(code.replace(/\s/g, ''), token);
      setSetup(null); setCode('');
      setStatus(await getOwner2fa(token));
      setNotice('Double authentification activée. À la prochaine connexion, le code de l’application vous sera demandé.');
    });
  };
  const turnOff = (e) => {
    e.preventDefault();
    run(async () => {
      await disableOwner2fa(code.replace(/\s/g, ''), token);
      setDisabling(false); setCode('');
      setStatus(await getOwner2fa(token));
      setNotice('Double authentification coupée : le mot de passe suffit de nouveau.');
    });
  };

  return (
    <>
      <PageHead
        title="Sécurité"
        info={(
          <>
            <p>La <b>double authentification</b> protège le pilotage même si quelqu’un découvre votre mot de passe : il lui faudrait aussi votre téléphone.</p>
            <p>Téléphone perdu ? Sur l’ordinateur, dans <i>backend-propre</i>, la commande <code>npm.cmd run proprietaire</code> envoie un lien pour choisir un nouveau mot de passe et coupe la double authentification. Vous pourrez ensuite la réactiver ici.</p>
          </>
        )}
      />

      {error && <div className="pil-card pil-error">{error}</div>}
      {notice && <div className="pil-card" style={{ borderColor: 'var(--pil-gold)' }}>{notice}</div>}

      <section className="pil-card">
        <div className="pil-card-head">
          <h2><Icon name="check" size={16} /> Double authentification</h2>
          {status && (
            <span className="pil-card-sub">
              {status.enabled ? `Active depuis le ${fmtLongDate(status.enabledAt)}` : 'Pas activée'}
            </span>
          )}
        </div>

        {status && !status.enabled && !setup && (
          <>
            <p className="pil-card-sub" style={{ margin: '0 0 12px' }}>
              Après le mot de passe, la connexion au pilotage demandera le code à 6 chiffres affiché par une
              application d’authentification sur votre téléphone (Google Authenticator, Microsoft Authenticator…
              ou celle que vous utilisez déjà pour Stripe).
            </p>
            <button type="button" className="pil-btn" onClick={start} disabled={busy}>
              {busy ? 'Un instant…' : 'Activer'}
            </button>
          </>
        )}

        {setup && (
          <form onSubmit={confirm}>
            <ol style={{ margin: '0 0 14px', paddingLeft: 20, lineHeight: 1.6 }}>
              <li>Ouvrez l’application d’authentification sur votre téléphone et ajoutez un compte (bouton « + »).</li>
              <li>Scannez ce QR code avec l’application.</li>
              <li>Tapez ci-dessous le code à 6 chiffres qu’elle affiche pour « Orgaly », puis « Confirmer ».</li>
            </ol>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
              <img
                src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(setup.qrSvg)}`}
                alt="QR code à scanner avec l’application d’authentification"
                width={180}
                height={180}
                style={{ background: '#fff', borderRadius: 10, padding: 6 }}
              />
              <div className="pil-card-sub" style={{ maxWidth: 300 }}>
                Le QR code ne passe pas ? Choisissez « Saisir une clé » dans l’application et tapez :
                <div style={{ fontFamily: 'monospace', fontSize: 15, color: 'var(--pil-text)', marginTop: 6, letterSpacing: 1 }}>{setup.secret}</div>
              </div>
            </div>
            <div className="pil-inline-actions" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {codeInput(code, setCode)}
              <button type="submit" className="pil-btn" disabled={busy || code.replace(/\s/g, '').length !== 6}>
                {busy ? 'Vérification…' : 'Confirmer'}
              </button>
              <button type="button" className="pil-btn-ghost" onClick={() => { setSetup(null); setCode(''); setError(''); }}>Annuler</button>
            </div>
          </form>
        )}

        {status?.enabled && !disabling && (
          <>
            <p className="pil-card-sub" style={{ margin: '0 0 12px' }}>
              À chaque connexion au pilotage, le code de l’application est demandé après le mot de passe.
            </p>
            <button type="button" className="pil-btn-ghost" onClick={() => { setDisabling(true); setCode(''); setNotice(''); }}>
              Couper la double authentification
            </button>
          </>
        )}

        {status?.enabled && disabling && (
          <form onSubmit={turnOff}>
            <p className="pil-card-sub" style={{ margin: '0 0 12px' }}>Pour la couper, tapez le code affiché en ce moment par l’application.</p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {codeInput(code, setCode)}
              <button type="submit" className="pil-btn" disabled={busy || code.replace(/\s/g, '').length !== 6}>
                {busy ? 'Vérification…' : 'Couper'}
              </button>
              <button type="button" className="pil-btn-ghost" onClick={() => { setDisabling(false); setCode(''); setError(''); }}>Annuler</button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
