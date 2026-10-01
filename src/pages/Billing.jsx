import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBilling, startCheckout, openPortal } from '../api/billing';
import { EDITOR } from '../legal/legalInfo';

const euros = (n) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
const date  = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

const RETURN_NOTICES = {
  succes: 'Paiement confirmé. Activation du plan Pro en cours…',
  annule: 'Paiement annulé : aucun montant n\'a été débité.',
};

export default function Billing() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [billing,    setBilling]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [acceptCgv,  setAcceptCgv]  = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Retour de la page de paiement Stripe (?statut=...), lu une seule fois à
  // l'arrivée : effacer le paramètre de l'URL ne doit pas relancer l'effet
  // (son nettoyage arrêterait la vérification en cours).
  const [statut] = useState(() => searchParams.get('statut'));
  const [notice, setNotice] = useState(() => RETURN_NOTICES[statut] ?? '');

  const load = useCallback(() => getBilling(token).then((b) => { setBilling(b); return b; }), [token]);

  useEffect(() => {
    load().catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (statut) setSearchParams({}, { replace: true });
  }, [statut, setSearchParams]);

  // Le plan n'est activé qu'à la réception du webhook, qui peut arriver
  // quelques secondes après le retour : on relit l'état jusqu'à le voir en Pro.
  useEffect(() => {
    if (statut !== 'succes') return;

    let attempts = 0;
    const timer = setInterval(async () => {
      attempts += 1;
      try {
        const b = await load();
        if (b.plan === 'pro') {
          setNotice('Votre plan Pro est actif. Merci pour votre confiance !');
          clearInterval(timer);
        } else if (attempts >= 8) {
          setNotice('Paiement reçu. L\'activation prend plus de temps que prévu : rechargez la page dans une minute.');
          clearInterval(timer);
        }
      } catch {
        clearInterval(timer);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [statut, load]);

  const redirectTo = async (action) => {
    setError('');
    setRedirecting(true);
    try {
      const { url } = await action(token);
      window.location.assign(url);
    } catch (err) {
      setError(err.message);
      setRedirecting(false);
    }
  };

  if (loading) return <div className="page"><p className="page-loading">Chargement…</p></div>;
  if (!billing) return <div className="page"><div className="notif-bar notif-bar--danger">{error}</div></div>;

  const isPro    = billing.plan === 'pro';
  const limit    = billing.freeEmployeeLimit;
  const count    = billing.activeEmployees;
  const monthly  = Math.max(1, count) * billing.pricePerEmployee;
  const atLimit  = !isPro && count >= limit;
  const usagePct = Math.min(100, (count / limit) * 100);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Abonnement</h1>
          <p className="page-subtitle">Votre offre, votre facturation et vos factures</p>
        </div>
      </div>

      {notice && <div className="notif-bar notif-bar--success">{notice}</div>}
      {error  && <div className="notif-bar notif-bar--danger">{error}</div>}
      {billing.subscriptionStatus === 'past_due' && (
        <div className="notif-bar notif-bar--warning">
          Le dernier prélèvement a échoué. Mettez à jour votre moyen de paiement pour conserver le plan Pro.
        </div>
      )}

      {/* ── Offre actuelle ─────────────────────────── */}
      <div className="section-card billing-current">
        <div className="billing-current-head">
          <div>
            <div className="billing-label">Offre actuelle</div>
            <div className="billing-plan-name">
              {isPro ? 'Pro' : 'Gratuit'}
              <span className={`badge ${isPro ? 'badge-info' : 'badge-active'}`}>
                {isPro ? `${euros(billing.pricePerEmployee)} HT / employé / mois` : 'Sans engagement'}
              </span>
            </div>
          </div>
          {billing.hasBillingAccount && (
            <button className="btn-secondary" disabled={redirecting} onClick={() => redirectTo(openPortal)}>
              {isPro ? 'Gérer mon abonnement' : 'Voir mes factures'}
            </button>
          )}
        </div>

        {isPro ? (
          <div className="billing-facts">
            <div><span>Employés actifs facturés</span><strong>{Math.max(1, count)}</strong></div>
            <div><span>Montant mensuel estimé</span><strong>{euros(monthly)} HT</strong></div>
            {billing.currentPeriodEnd && (
              <div>
                <span>{billing.cancelAtPeriodEnd ? 'Fin de l\'abonnement' : 'Prochaine échéance'}</span>
                <strong>{date(billing.currentPeriodEnd)}</strong>
              </div>
            )}
          </div>
        ) : (
          <div className="usage">
            <div className="usage-row">
              <span>Employés actifs</span>
              <strong>{count} / {limit}</strong>
            </div>
            <div className="usage-meter" role="progressbar" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={count}>
              <div className={`usage-meter-fill${atLimit ? ' full' : ''}`} style={{ width: `${usagePct}%` }} />
            </div>
            {atLimit && (
              <p className="hint">Limite du plan gratuit atteinte : passez au plan Pro pour ajouter d'autres employés.</p>
            )}
          </div>
        )}

        {isPro && billing.cancelAtPeriodEnd && (
          <p className="hint billing-note">
            Résiliation programmée : votre compte repassera au plan Gratuit à cette date, avec toutes ses données.
          </p>
        )}
      </div>

      {/* ── Comparatif / passage au Pro ───────────── */}
      {!isPro && (
        <div className="plan-grid">
          <div className="plan-card">
            <div className="plan-name">Gratuit</div>
            <div className="plan-price">0 €</div>
            <ul className="plan-features">
              <li>Jusqu'à {limit} employés actifs</li>
              <li>Congés, planning, pointage</li>
              <li>Bulletins de paie indicatifs</li>
            </ul>
            <div className="plan-current">Votre offre actuelle</div>
          </div>

          <div className="plan-card plan-card--pro">
            <div className="plan-name">Pro</div>
            <div className="plan-price">
              {euros(billing.pricePerEmployee)} <span>HT / employé actif / mois</span>
            </div>
            <ul className="plan-features">
              <li>Employés illimités</li>
              <li>Toutes les fonctionnalités du plan Gratuit</li>
              <li>Résiliable en ligne à tout moment</li>
            </ul>
            <p className="hint plan-estimate">
              Avec vos {count} employé{count > 1 ? 's' : ''} actif{count > 1 ? 's' : ''} : {euros(monthly)} HT par mois,
              ajusté au prorata quand leur nombre change. {EDITOR.vatMention}.
            </p>

            {billing.billingEnabled ? (
              <>
                <label className="consent-check">
                  <input type="checkbox" checked={acceptCgv} onChange={(e) => setAcceptCgv(e.target.checked)} />
                  <span>
                    J'accepte les <Link to="/cgv" target="_blank">conditions générales de vente</Link> et
                    l'<Link to="/dpa" target="_blank">accord de sous-traitance des données</Link>.
                  </span>
                </label>
                <button
                  className="btn-primary plan-cta"
                  disabled={!acceptCgv || redirecting}
                  onClick={() => redirectTo(startCheckout)}
                >
                  {redirecting ? 'Redirection vers le paiement…' : 'Passer au plan Pro'}
                </button>
              </>
            ) : (
              <button className="btn-primary plan-cta" disabled>Paiement en ligne bientôt disponible</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
