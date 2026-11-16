import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PRICING } from '../../legal/legalInfo';
import SiteLayout, { Logo } from './SiteLayout';
import { euros, sitePrice } from './siteUtils';

// Page Tarifs du site vitrine (16 nov. 2026, maquette « tarifs.html »).
// Les montants viennent de PRICING (legalInfo.js), mêmes règles que le
// serveur (billing.service.js) : si les prix changent, tout suit.

const EXAMPLES = [4, 6, 10, 15];

const INCLUDED = [
  'Planning semaine et mois', 'Horaires types à glisser', 'Semaines types', 'Accès des salariés sur téléphone',
  'Demandes et soldes de congés', 'Heures calculées, pointage en plus', 'Bulletins indicatifs en PDF', 'Réunions et notifications',
];

const FAQ = [
  {
    q: 'Comment sont comptés les salariés ?',
    a: "Ce sont les salariés actifs de votre espace, y compris ceux que vous avez invités et qui n'ont pas encore accepté. Le gérant n'est jamais compté.",
  },
  {
    q: "Faut-il une carte bancaire pour l'essai ?",
    a: `Non. Vous créez votre espace avec votre adresse e-mail, et rien ne vous est demandé pendant les ${PRICING.trialMonths} mois d'essai.`,
  },
  {
    q: 'Puis-je arrêter quand je veux ?',
    a: "Oui. L'abonnement est sans engagement, l'option IA aussi : vous arrêtez quand vous voulez.",
  },
  {
    q: 'Pourquoi « HT » ?',
    a: "Les prix sont hors taxes. Orgaly est une micro-entreprise : la TVA n'est pas applicable (article 293 B du Code général des impôts), vous payez donc le montant affiché.",
  },
];

export default function Tarifs() {
  const [yearly, setYearly] = useState(false);
  const [count, setCount] = useState(6);
  const p = sitePrice(count);
  const max = PRICING.capEmployees + 6; // la réglette va un peu au-delà du plafond

  return (
    <SiteLayout title="Tarifs — Orgaly">
      <section className="s-wrap s-t-hero">
        <div className="s-kicker">Tarifs</div>
        <h1>Des tarifs simples, qui suivent votre équipe</h1>
        <p>Gratuit jusqu'à {PRICING.freeEmployees} salariés, pour toujours. Au-delà, vous ne payez que les salariés en plus, avec un plafond.</p>
        <div className="s-toggle" role="group" aria-label="Période de paiement">
          <button type="button" className={yearly ? '' : 'is-on'} aria-pressed={!yearly} onClick={() => setYearly(false)}>Au mois</button>
          <button type="button" className={yearly ? 'is-on' : ''} aria-pressed={yearly} onClick={() => setYearly(true)}>
            À l'année <em>2 mois offerts</em>
          </button>
        </div>
      </section>

      <section className="s-wrap">
        <div className="s-plans">
          <div className="s-card">
            <span className="s-tag">Abonnement Orgaly</span>
            <h2>Tout l'abonnement, sans engagement</h2>
            <p className="s-sub">Planning, congés, heures et paie indicative : tout est inclus.</p>

            <div className="s-calc">
              <label htmlFor="s-count">Combien de salariés ? <small>(sans compter le gérant)</small></label>
              <div className="s-calc-row">
                <input
                  id="s-count" className="s-range" type="range" min="1" max={max} value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
                <output className="s-calc-count" htmlFor="s-count">
                  <b>{count >= max ? `${max}+` : count}</b> salarié{count > 1 ? 's' : ''}
                </output>
              </div>
              <div className="s-price" aria-live="polite">
                {p.monthly === 0
                  ? <><b>Gratuit</b><span>pour toujours</span></>
                  : yearly
                    ? <><b>{euros(p.yearly)}</b><span>HT / an</span></>
                    : <><b>{euros(p.monthly)}</b><span>HT / mois</span></>}
              </div>
              <div className="s-calc-detail">
                {p.extra === 0
                  ? `Jusqu'à ${PRICING.freeEmployees} salariés, tout l'abonnement est offert.`
                  : p.capped
                    ? `Plafond atteint : jamais plus de ${euros(PRICING.monthlyCapCents)} HT par mois, quel que soit le nombre de salariés.`
                    : `${PRICING.freeEmployees} salariés offerts + ${p.extra} × ${euros(PRICING.pricePerEmployeeCents)}`}
              </div>
              {p.monthly > 0 && (
                <div className="s-calc-year">
                  {yearly
                    ? `Soit ${euros(Math.round(p.yearly / 12))} HT par mois en moyenne (${PRICING.annualMonthsPaid} mois payés au lieu de 12)`
                    : `À l'année : ${euros(p.yearly)} HT (${PRICING.annualMonthsPaid} mois payés au lieu de 12)`}
                </div>
              )}
            </div>

            <div className="s-steps-price">
              <div><b>Gratuit</b>jusqu'à {PRICING.freeEmployees} salariés</div>
              <div><b>{euros(PRICING.pricePerEmployeeCents)}</b>HT par salarié en plus</div>
              <div><b>{euros(PRICING.monthlyCapCents)}</b>HT par mois au maximum</div>
            </div>
            <Link className="s-btn" to="/setup/admin" style={{ marginTop: 26 }}>Essayer {PRICING.trialMonths} mois gratuitement</Link>
            <p className="s-note">Sans carte bancaire · Sans engagement</p>
          </div>

          {/* Ce que comprend l'abonnement, à droite (demande de Cédric,
              16 nov. 2026 : l'option IA passe en dessous, les exemples à la fin) */}
          <div className="s-card s-incl-card">
            <span className="s-tag">Inclus dans l'abonnement</span>
            <h2>Tout, dès le premier salarié</h2>
            <p className="s-sub">Le même abonnement complet, quelle que soit la taille de votre équipe.</p>
            <ul className="s-incl-list">{INCLUDED.map((x) => <li key={x}>{x}</li>)}</ul>
          </div>
        </div>

        <div className="s-card s-ia-plan s-ia-wide" id="option-ia">
          <div>
            <span className="s-tag">✦ Option</span>
            <h2>IA avancée</h2>
            <p className="s-sub">Le planning du mois préparé pour vous, en quelques minutes.</p>
            <div className="s-price" style={{ marginTop: 22 }}>
              <b>{PRICING.aiOptionPrice}</b><span>HT / mois</span>
            </div>
            <Link className="s-btn s-btn--white" to="/contact?sujet=ia" style={{ marginTop: 24 }}>Demander l'option</Link>
            <small>S'ajoute à l'abonnement, même gratuit. Sans engagement : vous l'arrêtez quand vous voulez.</small>
          </div>
          <ul>
            <li>{PRICING.aiMonthlyGenerations} plannings du mois générés par mois</li>
            <li>S'inspire des habitudes de votre équipe</li>
            <li>Tient compte de vos demandes écrites</li>
            <li>Congés, contrats et repos vérifiés par Orgaly</li>
            <li>Rien n'est enregistré avant votre accord</li>
          </ul>
        </div>
      </section>

      <section className="s-block s-wrap" id="questions">
        <div className="s-sec-head"><div className="s-kicker">Questions sur les tarifs</div><h2>Bon à savoir</h2></div>
        <div className="s-faq">
          {FAQ.map((f, i) => (
            <details key={f.q} className="s-q" open={i === 0}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="s-wrap" style={{ paddingBottom: 96 }}>
        <div className="s-sec-head">
          <div className="s-kicker">Exemples</div>
          <h2>Combien vous paierez</h2>
          <p>Le gérant n'est jamais compté. Prix hors taxes ; TVA non applicable (art. 293 B du CGI).</p>
        </div>
        <table className="s-table">
          <thead><tr><th scope="col">Votre équipe</th><th scope="col">Au mois</th><th scope="col">À l'année</th></tr></thead>
          <tbody>
            <tr><td>1 à {PRICING.freeEmployees} salariés</td><td className="p free">Gratuit</td><td className="p free">Gratuit</td></tr>
            {EXAMPLES.map((n) => {
              const e = sitePrice(n);
              return <tr key={n}><td>{n} salariés</td><td className="p">{euros(e.monthly)}</td><td className="p">{euros(e.yearly)}</td></tr>;
            })}
            <tr>
              <td>{PRICING.capEmployees} salariés et plus</td>
              <td className="p">{euros(PRICING.monthlyCapCents)}</td>
              <td className="p">{euros(PRICING.monthlyCapCents * PRICING.annualMonthsPaid)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="s-wrap">
        <div className="s-final">
          <Logo size={56} />
          <h2>Essayez gratuitement pendant {PRICING.trialMonths} mois</h2>
          <p>Sans carte bancaire · Sans engagement</p>
          <Link className="s-btn s-btn--white" to="/setup/admin">Créer mon espace</Link>
        </div>
      </section>
    </SiteLayout>
  );
}
