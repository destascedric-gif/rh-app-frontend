import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SiteLayout, { CONTACT_EMAIL } from './SiteLayout';
import { Icon } from './siteUtils';

// Page Contact du site vitrine (16 nov. 2026, maquette « contact.html »).
// Le message part par e-mail vers contact@myorgaly.fr (serveur :
// POST /api/contact, rien n'est enregistré). Pas de téléphone sur le site
// (choix de Cédric). /contact?sujet=ia coche « L'option IA avancée ».

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const SUBJECTS = [
  { id: 'question', label: 'Une question' },
  { id: 'demo',     label: 'Une démonstration' },
  { id: 'ia',       label: "L'option IA avancée" },
  { id: 'autre',    label: 'Autre' },
];
const TEAM_SIZES = ['1 à 3', '4 à 10', '11 à 20', 'Plus de 20'];
const IA_MESSAGE = "Bonjour, je voudrais ajouter l'option IA avancée à mon abonnement.";

export default function Contact() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    subject: 'question', name: '', email: '', company: '', team: '', message: '', website: '',
  });
  // Sujet coché d'avance par le lien (après l'affichage : la page est
  // pré-rendue sans adresse complète)
  const wanted = params.get('sujet');
  useEffect(() => {
    if (!SUBJECTS.some((s) => s.id === wanted)) return;
    setForm((f) => ({ ...f, subject: wanted, message: wanted === 'ia' && !f.message.trim() ? IA_MESSAGE : f.message }));
  }, [wanted]);
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('sending');
    try {
      const res = await fetch(`${API}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Le message n'a pas pu partir.");
      setStatus('sent');
    } catch (err) {
      setError(err.message === 'Failed to fetch'
        ? `Le message n'a pas pu partir (connexion). Réessayez, ou écrivez directement à ${CONTACT_EMAIL}.`
        : err.message);
      setStatus('idle');
    }
  };

  return (
    <SiteLayout title="Contact — Orgaly">
      <div className="s-wrap s-c-grid">
        <div>
          <div className="s-kicker">Contact</div>
          <h1>Une question ? Écrivez-nous</h1>
          <p className="s-lead">Une démonstration, l'option IA, un doute sur les tarifs… Laissez votre message ici, nous vous répondons par e-mail.</p>
          <div className="s-c-side">
            <div>
              <i><Icon.mail size={20} /></i>
              <p><b>Par e-mail</b><span><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></span></p>
            </div>
            <div>
              <i><Icon.pin size={20} /></i>
              <p><b>Une démonstration chez vous ?</b><span>Nous passons volontiers vous montrer Orgaly en boutique, autour de Combs-la-Ville.</span></p>
            </div>
          </div>
        </div>

        <div className="s-form">
          {status === 'sent' ? (
            <div className="s-sent" role="status">
              <span className="s-check" />
              <h2>Message envoyé</h2>
              <p>Merci {form.name.split(' ')[0]} ! Nous vous répondons par e-mail à <b>{form.email}</b>.</p>
              <Link className="s-btn-ghost" to="/" style={{ marginTop: 22 }}>Retour à l'accueil</Link>
            </div>
          ) : (
            <form onSubmit={submit}>
              <fieldset className="s-f">
                <legend>Votre demande</legend>
                <div className="s-subjects">
                  {SUBJECTS.map((s) => (
                    <label key={s.id}>
                      <input
                        type="radio" name="subject" value={s.id} checked={form.subject === s.id}
                        onChange={(e) => setForm((f) => ({
                          ...f,
                          subject: e.target.value,
                          // Message tout prêt pour l'option IA (s'il est encore vide)
                          message: e.target.value === 'ia' && !f.message.trim() ? IA_MESSAGE : f.message,
                        }))}
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="s-f-row">
                <div className="s-f">
                  <label htmlFor="c-name">Votre nom</label>
                  <input id="c-name" required maxLength={100} autoComplete="name" value={form.name} onChange={set('name')} />
                </div>
                <div className="s-f">
                  <label htmlFor="c-email">Votre e-mail</label>
                  <input id="c-email" type="email" required maxLength={200} autoComplete="email" value={form.email} onChange={set('email')} />
                </div>
              </div>
              <div className="s-f-row">
                <div className="s-f">
                  <label htmlFor="c-company">Votre commerce <small>(facultatif)</small></label>
                  <input id="c-company" maxLength={120} autoComplete="organization" placeholder="Boulangerie des Tilleuls" value={form.company} onChange={set('company')} />
                </div>
                <div className="s-f">
                  <label htmlFor="c-team">Nombre de salariés <small>(facultatif)</small></label>
                  <select id="c-team" value={form.team} onChange={set('team')}>
                    <option value="">—</option>
                    {TEAM_SIZES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="s-f">
                <label htmlFor="c-message">Votre message</label>
                <textarea id="c-message" required minLength={5} maxLength={5000} value={form.message} onChange={set('message')} />
              </div>

              {/* Piège à robots : invisible et ignoré par les humains */}
              <div className="s-hp" aria-hidden="true">
                <label htmlFor="c-website">Site web</label>
                <input id="c-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
              </div>

              <p className="s-legal">
                Vos informations servent uniquement à vous répondre. Voir notre{' '}
                <Link to="/confidentialite">politique de confidentialité</Link>.
              </p>
              {error && <p className="s-error" role="alert">{error}</p>}
              <button type="submit" className="s-btn" disabled={status === 'sending'}>
                {status === 'sending' ? 'Envoi…' : 'Envoyer le message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
