import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBilling } from '../api/billing';
import { EDITOR } from '../legal/legalInfo';
import PageHeader from '../components/PageHeader';

const euros = (n) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const date  = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

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
  const paying = !billing.freeForever && price.monthly > 0;

  return (
    <div className="page">
      <PageHeader title="Abonnement" />

      {/* ── Votre abonnement : une seule phrase claire (16 nov. 2026, demande
          de Cédric : moins de cases ; pas de montant « à l'année » ici) ── */}
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
            <p className="billing-text">
              {plural(count, 'salarié')}
              {price.monthly === 0
                ? ` : jusqu'à ${p.freeEmployees} salariés, Orgaly est gratuit, sans limite de durée.`
                : price.capped
                  ? ` : plafond atteint, jamais plus de ${euros(p.monthlyCap)} HT par mois.`
                  : `, dont ${p.freeEmployees} offerts : ${plural(billed, 'salarié')} × ${euros(p.pricePerEmployee)} HT.`}
            </p>
            <p className="hint">
              Le gérant n'est pas compté ; les invitations en attente le sont. Le paiement en ligne n'est pas encore ouvert : rien ne vous est demandé pour le moment.
            </p>
          </>
        )}
      </div>

      {/* ── Les deux formules côte à côte (comme la page d'avant le 15 nov.) ── */}
      {!billing.freeForever && (
        <div className="plan-grid billing-plans">
          <div className={`plan-card${paying ? '' : ' plan-card--pro'}`}>
            <div className="plan-name">Gratuit</div>
            <div className="plan-price">0 €</div>
            <ul className="plan-features">
              <li>Jusqu'à {p.freeEmployees} salariés</li>
              <li>Planning, congés, pointage</li>
              <li>Bulletins de paie indicatifs</li>
              <li>Sans limite de durée</li>
            </ul>
            {!paying && <div className="plan-current">Votre offre actuelle</div>}
          </div>

          <div className={`plan-card${paying ? ' plan-card--pro' : ''}`}>
            <div className="plan-name">Au-delà de {p.freeEmployees} salariés</div>
            <div className="plan-price">
              {euros(p.pricePerEmployee)} <span>HT par salarié en plus / mois</span>
            </div>
            <ul className="plan-features">
              <li>Les {p.freeEmployees} premiers salariés restent offerts</li>
              <li>Jamais plus de {euros(p.monthlyCap)} HT par mois</li>
              <li>À l'année : {12 - p.annualMonthsPaid} mois offerts</li>
              <li>Sans engagement</li>
            </ul>
            <p className="hint plan-estimate">{EDITOR.vatMention}.</p>
            {paying
              ? <div className="plan-current">Votre offre actuelle</div>
              : <div className="plan-current">Dès votre {p.freeEmployees + 1}<sup>e</sup> salarié</div>}
          </div>
        </div>
      )}

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
