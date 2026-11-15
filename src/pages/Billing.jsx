import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBilling } from '../api/billing';
import { EDITOR } from '../legal/legalInfo';
import PageHeader from '../components/PageHeader';

const euros = (n) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const date  = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

// Prix pour un nombre de salariés : même calcul que le serveur
// (billing.service.js, computePrice), pour les exemples de la page
const priceFor = (n, p) => Math.min(p.monthlyCap, Math.max(0, n - p.freeEmployees) * p.pricePerEmployee);

// Page « Abonnement » (tarifs du 13 nov. 2026, affichés depuis le 15 nov.) :
// le prix est calculé et affiché, mais le paiement en ligne n'est pas encore
// ouvert : rien n'est demandé au gérant et rien n'est bloqué.
export default function Billing() {
  const { token } = useAuth();
  const [billing, setBilling] = useState(null);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getBilling(token).then(setBilling).catch((err) => setError(err.message));
  }, [token]);

  if (error) return <div className="page"><div className="notif-bar notif-bar--danger">{error}</div></div>;
  if (!billing) return <div className="page"><p className="page-loading">Chargement…</p></div>;

  const p      = billing.pricing;
  const count  = billing.activeEmployees;
  const price  = billing.price;
  const billed = price.billedEmployees;
  const capAt  = p.freeEmployees + Math.ceil(p.monthlyCap / p.pricePerEmployee);
  const examples = [p.freeEmployees + 1, p.freeEmployees + 3, 10, capAt];

  return (
    <div className="page">
      <PageHeader title="Abonnement" />

      {/* ── Ce que paie l'entreprise ──────────────── */}
      <div className="section-card billing-current">
        <div className="billing-current-head">
          <div>
            <div className="billing-label">Votre abonnement</div>
            <div className="billing-plan-name">
              {billing.freeForever ? 'Offert' : price.monthly === 0 ? 'Gratuit' : `${euros(price.monthly)} HT / mois`}
              {billing.freeForever
                ? <span className="badge badge-active">Premier client d'Orgaly</span>
                : billing.inTrial && <span className="badge badge-info">Essai gratuit jusqu'au {date(billing.trialEndsAt)}</span>}
            </div>
          </div>
        </div>

        {billing.freeForever ? (
          <p className="billing-text">
            Votre entreprise fait partie des premiers clients d'Orgaly : l'abonnement vous est offert,
            quel que soit le nombre de salariés ({plural(count, 'salarié')} aujourd'hui).
          </p>
        ) : (
          <>
            <div className="billing-facts">
              <div><span>Salariés comptés</span><strong>{count}</strong></div>
              <div>
                <span>Dont offerts</span>
                <strong>{Math.min(count, p.freeEmployees)}</strong>
              </div>
              <div>
                <span>Prix par mois</span>
                <strong>{price.monthly === 0 ? 'Gratuit' : `${euros(price.monthly)} HT`}</strong>
              </div>
              {price.monthly > 0 && (
                <div>
                  <span>Ou payé à l'année</span>
                  <strong>{euros(price.annual)} HT / an</strong>
                </div>
              )}
            </div>
            <p className="hint billing-note">
              {price.monthly === 0
                ? `Jusqu'à ${p.freeEmployees} salariés, Orgaly est gratuit, sans limite de durée.`
                : price.capped
                  ? `Plafond atteint : ${euros(p.monthlyCap)} HT par mois au plus, quel que soit le nombre de salariés.`
                  : `${plural(billed, 'salarié')} en plus des ${p.freeEmployees} offerts × ${euros(p.pricePerEmployee)} HT.`}
              {' '}Le gérant n'est pas compté ; les invitations en attente le sont.
            </p>
            <p className="hint billing-note">
              Le paiement en ligne n'est pas encore ouvert : rien ne vous est demandé pour le moment.
              {billing.inTrial && ` Votre essai gratuit dure jusqu'au ${date(billing.trialEndsAt)}.`}
            </p>
          </>
        )}
      </div>

      {/* ── Comment le prix est calculé ───────────── */}
      <div className="section-card">
        <h2 className="section-title">Comment le prix est calculé</h2>
        <ul className="plan-features billing-rules">
          <li>Les {p.freeEmployees} premiers salariés sont toujours offerts.</li>
          <li>Puis {euros(p.pricePerEmployee)} HT par salarié en plus et par mois.</li>
          <li>Jamais plus de {euros(p.monthlyCap)} HT par mois et par boutique (atteint à {capAt} salariés).</li>
          <li>Paiement à l'année : {p.annualMonthsPaid} mois payés pour 12, soit {12 - p.annualMonthsPaid} mois offerts.</li>
          <li>{p.trialMonths} mois d'essai gratuits à l'inscription, sans carte bancaire.</li>
        </ul>
        <div className="billing-examples">
          {examples.map((n) => (
            <div key={n}>
              <span>{plural(n, 'salarié')}</span>
              <strong>{euros(priceFor(n, p))} HT / mois</strong>
            </div>
          ))}
        </div>
        <p className="hint billing-note">Sans engagement. {EDITOR.vatMention}.</p>
      </div>

      {/* ── Option IA : seulement pour les entreprises qui y ont accès ── */}
      {billing.aiPlanningEnabled && (
        <div className="section-card">
          <div className="billing-current-head">
            <div>
              <div className="billing-label">Option</div>
              <div className="billing-plan-name">
                IA avancée
                <span className="badge badge-info">
                  {billing.freeForever ? 'Offerte' : `${euros(p.aiOptionPrice)} HT / mois`}
                </span>
              </div>
            </div>
          </div>
          <p className="billing-text">
            Le planning du mois proposé par l'IA, à partir de vos habitudes : {p.aiMonthlyGenerations} générations
            par mois.
          </p>
          <div className="usage">
            <div className="usage-row">
              <span>Générations utilisées ce mois-ci</span>
              <strong>{billing.aiGenerationsUsed} / {p.aiMonthlyGenerations}</strong>
            </div>
            <div className="usage-meter" role="progressbar" aria-valuemin={0} aria-valuemax={p.aiMonthlyGenerations} aria-valuenow={billing.aiGenerationsUsed}>
              <div
                className={`usage-meter-fill${billing.aiGenerationsUsed >= p.aiMonthlyGenerations ? ' full' : ''}`}
                style={{ width: `${Math.min(100, (billing.aiGenerationsUsed / p.aiMonthlyGenerations) * 100)}%` }}
              />
            </div>
            <p className="hint">Le compteur repart à zéro le 1er de chaque mois.</p>
          </div>
        </div>
      )}
    </div>
  );
}
