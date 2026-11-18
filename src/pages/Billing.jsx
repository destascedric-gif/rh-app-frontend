import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBilling, requestAiOption, startCheckout, openPortal } from '../api/billing';
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

// Lien « Ce qui est inclus › » : la liste s'ouvre dans une petite bulle au
// clic (refermée par un clic ailleurs ou Échap) au lieu d'occuper la page.
function MorePopover({ label, children, dark = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);
  return (
    <span className="abo-more-wrap" ref={ref}>
      <button type="button" className={`abo-more${dark ? ' abo-more--dark' : ''}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label} ›
      </button>
      {open && <div className="abo-pop" role="dialog" aria-label={label}>{children}</div>}
    </span>
  );
}

// Page « Abonnement » (18 nov. 2026, allégée : proposition B choisie par
// Cédric, avec la carte IA gardée en bleu nuit) : deux cartes côte à côte,
// mon abonnement et l'option IA avancée ; prix, une phrase, un bouton.
// Les listes de ce qui est inclus s'ouvrent au clic ; plus de cases CGV à
// cocher, une phrase sous le bouton de paiement.
// Paiement en ligne Stripe depuis le 17 nov. 2026 : abonnement au mois ou à
// l'année (pris pendant l'essai, premier prélèvement à la fin de l'essai) et
// option IA au mois, deux abonnements séparés. Tant que Stripe n'est pas
// configuré sur le serveur, la page garde l'ancien affichage (« bientôt »,
// demande de l'option IA par e-mail).
export default function Billing() {
  const { token } = useAuth();
  const [params] = useSearchParams();
  const [billing, setBilling] = useState(null);
  const [error,   setError]   = useState('');
  const [busy,    setBusy]    = useState('');
  const [baseError, setBaseError] = useState('');
  const [aiError, setAiError] = useState('');
  const [interval, setPayInterval] = useState('month');
  const statut = params.get('statut');

  const load = useCallback(
    () => getBilling(token).then(setBilling).catch((err) => setError(err.message)),
    [token]
  );
  useEffect(() => { load(); }, [load]);
  // Retour de Stripe : l'abonnement est enregistré par Stripe quelques
  // secondes après le paiement, on relit la page un peu plus tard.
  useEffect(() => {
    if (statut !== 'succes') return undefined;
    const t = setTimeout(load, 4000);
    return () => clearTimeout(t);
  }, [statut, load]);

  if (error) return <div className="page"><div className="notif-bar notif-bar--danger">{error}</div></div>;
  if (!billing) return <div className="page"><p className="page-loading">Chargement…</p></div>;

  const p      = billing.pricing;
  const count  = billing.activeEmployees;
  const price  = billing.price;
  // La démo est en « pro » depuis toujours, sans compte Stripe : pas un vrai abonnement
  const pro    = billing.plan === 'pro' && billing.hasBillingAccount;
  const paying = !billing.freeForever && price.monthly > 0;
  const canPay = !pro && paying && billing.billingEnabled;
  const used   = billing.aiGenerationsUsed;
  const limit  = p.aiMonthlyGenerations;
  const annual = Math.round(price.monthly * p.annualMonthsPaid * 100) / 100;
  // Le grand prix suit le choix « au mois / à l'année » tant que rien n'est payé
  const showYear = canPay && interval === 'year';

  const go = async (key, action, setErr) => {
    setErr('');
    setBusy(key);
    try {
      const { url } = await action();
      window.location.href = url;
    } catch (err) {
      setErr(err.message);
      setBusy('');
    }
  };
  const payBase   = () => go('base', () => startCheckout(token, 'base', interval), setBaseError);
  const payAi     = () => go('ai', () => startCheckout(token, 'ai'), setAiError);
  const portal    = (setErr) => go('portal', () => openPortal(token), setErr);

  const askAi = async () => {
    setAiError('');
    setBusy('ask');
    try {
      const { requestedAt } = await requestAiOption(token);
      setBilling((b) => ({ ...b, aiOptionRequestedAt: requestedAt }));
    } catch (err) {
      setAiError(err.message);
    } finally {
      setBusy('');
    }
  };

  const cgv = <>En payant, vous acceptez les <Link to="/cgv" target="_blank">conditions générales de vente</Link>. Paiement sécurisé par Stripe.</>;

  return (
    <div className="page">
      <PageHeader title="Abonnement" />

      {statut === 'succes' && (
        <div className="abo-alert abo-alert--ok">Merci ! Votre paiement est enregistré. La page se met à jour dans quelques secondes.</div>
      )}
      {statut === 'annule' && (
        <div className="abo-alert abo-alert--info">Paiement annulé : rien n'a été débité.</div>
      )}

      <div className="abo-grid">
        {/* ── Mon abonnement ─────────────────────────── */}
        <section className="section-card abo-box">
          <div className="abo-box-head">
            <div className="billing-label">Mon abonnement</div>
            <MorePopover label="Ce qui est inclus">
              <ul className="abo-pop-list">{INCLUDED.map((x) => <li key={x}>{x}</li>)}</ul>
              <p className="abo-pop-note">
                {p.freeEmployees} salariés offerts, puis {euros(p.pricePerEmployee)} HT par salarié · {euros(p.monthlyCap)} HT
                par mois au maximum · sans engagement · le gérant n'est pas compté · {EDITOR.vatMention}.
              </p>
            </MorePopover>
          </div>

          <div className="abo-price">
            {billing.freeForever
              ? <b>Offert</b>
              : price.monthly === 0
                ? <b>Gratuit</b>
                : showYear
                  ? <><b>{euros(annual)}</b><span>HT / an</span></>
                  : <><b>{euros(price.monthly)}</b><span>HT / mois</span></>}
          </div>
          <p className="abo-sub">
            {billing.freeForever
              ? `Premier client d'Orgaly : offert quel que soit le nombre de salariés (${plural(count, 'salarié')} aujourd'hui).`
              : price.monthly === 0
                ? `${plural(count, 'salarié')} · gratuit jusqu'à ${p.freeEmployees} salariés, sans limite de durée.`
                : showYear
                  ? `${plural(count, 'salarié')} · au lieu de ${euros(Math.round(price.monthly * 12 * 100) / 100)} payés au mois`
                  : price.capped
                    ? `${plural(count, 'salarié')} · plafond atteint`
                    : `${plural(count, 'salarié')}, dont ${p.freeEmployees} offerts`}
          </p>
          {paying && billing.inTrial && !pro && (
            <p><span className="abo-trial">Essai gratuit jusqu'au {date(billing.trialEndsAt)}</span></p>
          )}

          <div className="abo-box-foot">
            {pro ? (
              <>
                <p className="abo-total">
                  Abonnement en place · paiement {billing.billingInterval === 'year' ? "à l'année" : 'au mois'}
                  {billing.currentPeriodEnd && (
                    billing.cancelAtPeriodEnd
                      ? <> · se termine le <b>{date(billing.currentPeriodEnd)}</b></>
                      : <> · prochain prélèvement le <b>{date(billing.currentPeriodEnd)}</b></>
                  )}
                </p>
                <button type="button" className="btn-secondary" disabled={busy === 'portal'} onClick={() => portal(setBaseError)}>
                  {busy === 'portal' ? 'Ouverture…' : 'Gérer mon abonnement'}
                </button>
                <p className="abo-legal">Carte bancaire, factures, résiliation.</p>
              </>
            ) : canPay ? (
              <>
                <div className="abo-interval" role="group" aria-label="Rythme de paiement">
                  <button type="button" className={interval === 'month' ? 'on' : ''} onClick={() => setPayInterval('month')}>Au mois</button>
                  <button type="button" className={interval === 'year' ? 'on' : ''} onClick={() => setPayInterval('year')}>
                    À l'année<small>2 mois offerts</small>
                  </button>
                </div>
                <div>
                  <button type="button" className="btn-primary abo-pay" disabled={billing.demo || busy === 'base'} onClick={payBase}>
                    {busy === 'base' ? 'Ouverture…' : 'Payer mon abonnement'}
                  </button>
                </div>
                <p className="abo-legal">
                  {billing.demo
                    ? 'Compte de démonstration : le paiement est désactivé.'
                    : <>{billing.inTrial && <>Rien n'est prélevé avant le {date(billing.trialEndsAt)}. </>}{cgv}</>}
                </p>
              </>
            ) : paying ? (
              <>
                <button type="button" className="btn-secondary" disabled>Payer mon abonnement · bientôt</button>
                <p className="abo-legal">Rien ne vous est demandé pour le moment.</p>
              </>
            ) : null}
            {baseError && <p className="abo-error abo-error--light">{baseError}</p>}
          </div>
        </section>

        {/* ── Option IA avancée (bleu nuit) ──────────── */}
        <section className="section-card abo-box abo-ia">
          <div className="abo-box-head">
            <div className="abo-ia-title">
              <span className="billing-label">Option</span>
              <span className="abo-ia-tag">✦ IA avancée</span>
            </div>
            <MorePopover label="En savoir plus" dark>
              <ul className="abo-pop-list abo-pop-list--one">{AI_FEATURES.map((x) => <li key={x}>{x}</li>)}</ul>
            </MorePopover>
          </div>

          <div className="abo-price">
            {billing.freeForever && billing.aiPlanningEnabled
              ? <b>Offerte</b>
              : <><b>{euros(p.aiOptionPrice)}</b><span>HT / mois</span></>}
          </div>
          <p className="abo-sub">Le planning du mois préparé en quelques minutes · {limit} par mois.</p>

          <div className="abo-box-foot">
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
                <p className="abo-legal">
                  Le compteur repart à zéro le 1er de chaque mois.
                  {billing.aiBilledViaStripe && (
                    <> <button type="button" className="abo-link" disabled={busy === 'portal'} onClick={() => portal(setAiError)}>Gérer ou résilier l'option</button></>
                  )}
                </p>
              </div>
            ) : billing.aiBillingEnabled ? (
              <>
                <div>
                  <button type="button" className="abo-ask" disabled={billing.demo || busy === 'ai'} onClick={payAi}>
                    {busy === 'ai' ? 'Ouverture…' : "Prendre l'option"}
                  </button>
                </div>
                <p className="abo-legal">Sans engagement, payée au mois dès aujourd'hui. {cgv}</p>
              </>
            ) : billing.aiOptionRequestedAt ? (
              <p className="abo-requested">
                Demande envoyée le {date(billing.aiOptionRequestedAt)} : nous vous recontactons très vite.
              </p>
            ) : (
              <div>
                <button type="button" className="abo-ask" disabled={busy === 'ask'} onClick={askAi}>
                  {busy === 'ask' ? 'Envoi…' : "Demander l'option"}
                </button>
              </div>
            )}
            {aiError && <p className="abo-error">{aiError}</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
