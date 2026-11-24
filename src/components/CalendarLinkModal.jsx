import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCalendarLink, resetCalendarLink } from '../api/calendar';

// « Mon planning dans mon agenda » (24 nov. 2026, maquette A validée par
// Cédric) : lien personnel vers un agenda .ics que Google Agenda ou l'agenda
// de l'iPhone relisent tout seuls. Sens unique : Orgaly → agenda. Contenu :
// créneaux de travail, réunions, congés (pas les repos).

export const CalendarIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9.5h18M8 3v3M16 3v3" /><path d="M12 13v5M9.5 15.5h5" />
  </svg>
);
const AppleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM13.9 5c.7-.8 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z" /></svg>
);
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" /><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8C3.9 20.5 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.7 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V7.1H2.1C1.4 8.6 1 10.2 1 12s.4 3.4 1.1 4.9l3.6-2.8z" /><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2C17.5 2.1 15 1 12 1 7.7 1 3.9 3.5 2.1 7.1l3.6 2.8c.9-2.6 3.4-4.5 6.3-4.5z" /></svg>
);

// Onglet ouvert d'office : Apple sur iPhone / iPad / Mac, Google sinon
const defaultTab = () => (/iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent) ? 'apple' : 'google');

export default function CalendarLinkModal({ onClose }) {
  const { token } = useAuth();
  const [tab, setTab] = useState(defaultTab);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getCalendarLink(token).then((d) => setUrl(d.url)).catch((err) => setError(err.message));
  }, [token]);

  const webcal = url.replace(/^https?:\/\//, 'webcal://');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.getElementById('cal-link-input');
      input?.select();
      document.execCommand?.('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const reset = async () => {
    setBusy(true);
    setError('');
    try {
      const d = await resetCalendarLink(token);
      setUrl(d.url);
      setConfirmReset(false);
      setResetDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal cal-modal" role="dialog" aria-modal="true" aria-labelledby="cal-modal-title">
        <h3 id="cal-modal-title">Mon planning dans mon agenda</h3>
        <p className="cal-sub">
          Vos créneaux, réunions et congés acceptés s'affichent dans l'agenda de votre téléphone, à côté de vos
          rendez-vous. Ils se mettent à jour tout seuls.
        </p>

        <div className="role-toggle cal-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'apple'} className={`role-btn${tab === 'apple' ? ' active' : ''}`} onClick={() => setTab('apple')}>
            <AppleIcon /> iPhone, iPad, Mac
          </button>
          <button type="button" role="tab" aria-selected={tab === 'google'} className={`role-btn${tab === 'google' ? ' active' : ''}`} onClick={() => setTab('google')}>
            <GoogleIcon /> Android, Google Agenda
          </button>
        </div>

        {!url && !error && <p className="hint">Préparation de votre lien…</p>}

        {url && tab === 'apple' && (
          <>
            <ol className="cal-steps">
              <li>Ouvrez cette page <b>sur votre iPhone</b> (ou iPad, Mac).</li>
              <li>
                Touchez le bouton ci-dessous, puis <b>« S'abonner »</b>.
                <span className="hint">Choisissez le compte « iCloud » si l'iPhone le demande.</span>
              </li>
            </ol>
            <a className="btn-primary cal-big" href={webcal}><AppleIcon /> Ajouter à l'agenda de l'iPhone</a>
            <p className="cal-note">
              Les changements du planning arrivent en général en moins d'une heure. En cas de doute, c'est Orgaly qui
              fait foi.
            </p>
          </>
        )}

        {url && tab === 'google' && (
          <>
            <ol className="cal-steps">
              <li>
                <b>Copiez votre lien</b> :
                <div className="cal-link">
                  <input id="cal-link-input" readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Lien de votre agenda" />
                  <button type="button" className="btn-primary" onClick={copy}>{copied ? 'Copié' : 'Copier'}</button>
                </div>
              </li>
              <li>
                Sur un <b>ordinateur</b>, ouvrez{' '}
                <a href="https://calendar.google.com/calendar/r/settings/addbyurl" target="_blank" rel="noreferrer">
                  Google Agenda → « À partir de l'URL »
                </a>.
                <span className="hint">
                  L'appli Google Agenda du téléphone ne permet pas cet ajout : il se fait une seule fois, depuis un
                  ordinateur.
                </span>
              </li>
              <li>Collez le lien et cliquez sur <b>« Ajouter l'agenda »</b>. Il apparaît ensuite aussi sur votre téléphone Android.</li>
            </ol>
            <p className="cal-note">
              Google met à jour ce type d'agenda lui-même, en général dans la journée : un changement de dernière minute
              peut arriver en retard. En cas de doute, c'est Orgaly qui fait foi.
            </p>
          </>
        )}

        {error && <p className="error-msg">{error}</p>}

        {url && (
          <div className="cal-priv">
            {confirmReset ? (
              <>
                <span>L'ancien lien ne marchera plus : il faudra refaire l'ajout dans votre agenda.</span>
                <span className="cal-priv-actions">
                  <button type="button" className="btn-ghost" onClick={() => setConfirmReset(false)} disabled={busy}>Garder</button>
                  <button type="button" className="btn-danger" onClick={reset} disabled={busy}>{busy ? 'Changement…' : 'Changer le lien'}</button>
                </span>
              </>
            ) : (
              <>
                <span>
                  {resetDone
                    ? 'Nouveau lien créé : l\'ancien ne marche plus. Refaites l\'ajout dans votre agenda.'
                    : 'Ce lien est personnel : toute personne qui l\'a voit votre planning.'}
                </span>
                {!resetDone && <button type="button" className="link-btn" onClick={() => setConfirmReset(true)}>Changer mon lien</button>}
              </>
            )}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
