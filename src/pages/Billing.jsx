import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBilling, requestAiOption } from '../api/billing';
import { EDITOR } from '../legal/legalInfo';
import PageHeader from '../components/PageHeader';

// 11,7 → « 11,70 € » ; 79 → « 79 € »
const euros = (n) => n.toLocaleString('fr-FR', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
});
const date  = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

const INCLUDED = [
  'Planning semaine et mois', 'Horaires et semaines types',
  'Salariés sur leur téléphone', 'Demandes de congés',
  'Heures et heures sup.', 'Pointage en plus',
  'Bulletins indicatifs', 'Réunions et notifications',
];

const AI_FEATURES = [
  'Le planning du mois préparé en quelques minutes',
  "S'inspire des habitudes de votre équipe",
  'Tient compte de vos demandes écrites',
  'Congés, contrats et repos vérifiés par Orgaly',
  "Rien n'est enregistré sans votre accord",
];

// Page « Abonnement » (16 nov. 2026, proposition B choisie par Cédric) :
// deux encadrés seulement, l'un sous l'autre : mon abonnement (prix et ce
// qui est inclus), puis l'option IA avancée (bouton « Demander l'option »,
// remplacé par le compteur du mois une fois l'option active). Le paiement
// en ligne n'est pas encore ouvert : rien n'est demandé, rien n'est bloqué.
export default function Billing() {
  const { token } = useAuth();
  const [billing, setBilling] = useState(null);
  const [error,   setError]   = useState('');
  const [sending, setSending] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    getBilling(token).then(setBilling).catch((err) => setError(err.message));
  }, [token]);

  if (error) return <div className="page"><div className="notif-bar notif-bar--danger">{error}</div></div>;
  if (!billing) return <div className="page"><p className="page-loading">Chargement…</p></div>;

  const p      = billing.pricing;
  const count  = billing.activeEmployees;
  const price  = billing.price;
  const paying = !billing.freeForever && price.monthly > 0;
  const used   = billing.aiGenerationsUsed;
  const limit  = p.aiMonthlyGenerations;

  const askAi = async () => {
    setAiError('');
    setSending(true);
    try {
      const { requestedAt } = await requestAiOption(token);
      setBilling((b) => ({ ...b, aiOptionRequestedAt: requestedAt }));
    } catch (err) {
      setAiError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page">
      <PageHeader title="Abonnement" />

      {/* ── Mon abonnement ─────────────────────────── */}
      <div className="section-card abo-card">
        <div>
          <div className="billing-label">Mon abonnement</div>
          <div className="abo-price">
            {billing.freeForever
              ? <b>Offert</b>
              : price.monthly === 0
                ? <b>Gratuit</b>
                : <><b>{euros(price.monthly)}</b><span>HT / mois</span></>}
          </div>
          <p className="abo-sub">
            {billing.freeForever
              ? `Premier client d'Orgaly : l'abonnement vous est offert, quel que soit le nombre de salariés (${plural(count, 'salarié')} aujourd'hui).`
              : price.monthly === 0
                ? `${plural(count, 'salarié')} · gratuit jusqu'à ${p.freeEmployees} salariés, sans limite de durée.`
                : price.capped
                  ? `${plural(count, 'salarié')} · plafond atteint`
                  : `${plural(count, 'salarié')}, dont ${p.freeEmployees} offerts`}
            {paying && billing.inTrial && (
              <> · <span className="badge badge-info">Essai jusqu'au {date(billing.trialEndsAt)}</span></>
            )}
          </p>
          {paying && (
            <>
              <button type="button" className="btn-secondary abo-pay" disabled>Payer mon abonnement · bientôt</button>
              <p className="hint">Rien ne vous est demandé pour le moment.</p>
            </>
          )}
        </div>
        <div>
          <ul className="abo-checks abo-checks--two">
            {INCLUDED.map((x) => <li key={x}>{x}</li>)}
          </ul>
          <p className="hint abo-rules">
            {p.freeEmployees} salariés offerts, puis {euros(p.pricePerEmployee)} HT par salarié ·{' '}
            {euros(p.monthlyCap)} HT par mois au maximum · Sans engagement. Le gérant n'est pas compté.{' '}
            {EDITOR.vatMention}.
          </p>
        </div>
      </div>

      {/* ── Option IA avancée ──────────────────────── */}
      <div className="section-card abo-card abo-ia">
        <div>
          <div className="billing-label">Option</div>
          <h2 className="abo-title">IA avancée</h2>
          <div className="abo-price">
            {billing.freeForever && billing.aiPlanningEnabled
              ? <b>Offerte</b>
              : <><b>{euros(p.aiOptionPrice)}</b><span>HT / mois</span></>}
          </div>
          <p className="abo-sub">{limit} plannings du mois générés par mois.</p>

          {billing.aiPlanningEnabled ? (
            // Option active : le compteur du mois remplace le bouton
            <div className="abo-usage">
              <div className="usage-row">
                <span>Plannings générés ce mois-ci</span>
                <strong>{used} / {limit}</strong>
              </div>
              <div className="usage-meter" role="progressbar" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={used}>
                <div
                  className={`usage-meter-fill${used >= limit ? ' full' : ''}`}
                  style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
                />
              </div>
              <p className="abo-note">Le compteur repart à zéro le 1er de chaque mois.</p>
            </div>
          ) : billing.aiOptionRequestedAt ? (
            <p className="abo-requested">
              Demande envoyée le {date(billing.aiOptionRequestedAt)} : nous vous recontactons très vite.
            </p>
          ) : (
            <>
              <button type="button" className="abo-ask" disabled={sending} onClick={askAi}>
                {sending ? 'Envoi…' : "Demander l'option"}
              </button>
              {aiError && <p className="abo-error">{aiError}</p>}
            </>
          )}
        </div>
        <ul className="abo-checks abo-checks--two">
          {AI_FEATURES.map((x) => <li key={x}>{x}</li>)}
        </ul>
      </div>
    </div>
  );
}
