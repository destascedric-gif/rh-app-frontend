import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LEGAL_PAGES, PRICING } from '../legal/legalInfo';
import './Landing.css';

// Exemple de semaine affiché dans l'aperçu (ouverture 8h30–14h, fermeture 14h–20h)
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const O = { kind: 'open',  label: '8h30–14h' };
const F = { kind: 'close', label: '14h–20h' };
const R = { kind: 'off',   label: 'Repos' };
const WEEK = [
  { name: 'Sarah',  cells: [O, O, R, O, F, F] },
  { name: 'Mehdi',  cells: [F, F, O, R, O, O] },
  { name: 'Julie',  cells: [O, R, F, F, F, R] },
  { name: 'Thomas', cells: [R, O, O, O, R, F] },
];

const CHANGES = [
  {
    title:  'Le planning',
    before: 'Une feuille à refaire chaque semaine, puis à afficher en réserve.',
    after:  "Vos créneaux habituels se placent d'un geste, et chacun retrouve son planning sur son téléphone.",
  },
  {
    title:  'Les congés',
    before: 'Des demandes par message, faciles à oublier, et des soldes tenus de tête.',
    after:  'Le salarié fait sa demande dans Orgaly, vous acceptez en un clic, le solde se met à jour.',
  },
  {
    title:  'Les heures',
    before: 'Additionnées à la calculatrice en fin de mois, avec le risque de se tromper.',
    after:  'Calculées automatiquement à partir du pointage, heures supplémentaires comprises.',
  },
];

const AUDIENCE = [
  'Pharmacie', 'Boulangerie', 'Restaurant', 'Salon de coiffure',
  'Commerce de quartier', 'Jeune entreprise qui embauche',
];

const LogoMark = () => (
  <span className="landing-logo-mark">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 17V7l8-4 8 4v10l-8 4-8-4Z" />
      <path d="M4 7l8 4 8-4" />
      <path d="M12 11v10" />
    </svg>
  </span>
);

export default function Landing() {
  const { user } = useAuth();
  const homePath = user?.role === 'admin' ? '/dashboard' : '/mon-planning';

  useEffect(() => { document.title = "Orgaly — la gestion d'équipe simple"; }, []);

  return (
    <div className="landing">
      <header className="landing-wrap landing-header">
        <Link to="/" className="landing-brand"><LogoMark /> Orgaly</Link>
        <nav aria-label="Navigation principale" className="landing-nav">
          <a href="#tarif" className="landing-nav-link">Tarif</a>
          {user
            ? <Link to={homePath} className="landing-btn-outline">Mon espace</Link>
            : <Link to="/login" className="landing-btn-outline">Se connecter</Link>}
        </nav>
      </header>

      {/* ── Accroche + aperçu du planning ─────────────── */}
      <section className="landing-wrap landing-hero">
        <div className="landing-hero-text">
          <div className="landing-eyebrow">Planning · Congés · Heures</div>
          <h1>La gestion d'équipe simple, même sans service RH.</h1>
          <p className="landing-lead">
            Orgaly remplace le planning papier, les demandes de congés par message et le calcul des
            heures à la calculatrice. Vous y passez moins de temps, et vous vous trompez moins.
          </p>
          <div className="landing-actions">
            <Link to="/setup/admin" className="landing-btn">Créer mon espace</Link>
            <a href="#change" className="landing-btn-text">Voir ce qui change</a>
          </div>
          <div className="landing-note">
            Gratuit jusqu'à {PRICING.freeEmployeeLimit} salariés · Sans carte bancaire
          </div>
        </div>

        <div className="landing-preview" aria-label="Exemple de planning dans Orgaly">
          <div className="landing-preview-card">
            <div className="landing-preview-inner">
              <div className="landing-preview-head">
                <strong>Semaine du 6 octobre</strong>
                <div className="landing-legend">
                  <span><i className="dot dot--open" />Ouverture</span>
                  <span><i className="dot dot--close" />Fermeture</span>
                </div>
              </div>
              <div className="landing-week">
                <div />
                {DAYS.map((d) => <div key={d} className="landing-week-day">{d}</div>)}
                {WEEK.map((row) => (
                  <div key={row.name} className="landing-week-row">
                    <div className="landing-week-name">{row.name}</div>
                    {row.cells.map((c, i) => (
                      <div key={i} className={`landing-shift landing-shift--${c.kind}`}>{c.label}</div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="landing-preview-foot">
                <span>Heures planifiées cette semaine</span>
                <strong>103 h</strong>
              </div>
            </div>
          </div>

          <div className="landing-leave-card">
            <div className="landing-leave-label">Demande de congé</div>
            <div><strong>Julie</strong> · du 20 au 24 octobre</div>
            <div className="landing-leave-actions">
              <span className="landing-fake-btn landing-fake-btn--primary">Accepter</span>
              <span className="landing-fake-btn">Refuser</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Avant / avec Orgaly ───────────────────────── */}
      <section id="change" className="landing-band">
        <div className="landing-wrap landing-section">
          <h2>Ce qui change au quotidien</h2>
          <p className="landing-section-lead">
            Trois tâches qui prennent du temps chaque semaine, et la façon dont Orgaly s'en charge.
          </p>
          <div className="landing-changes">
            {CHANGES.map((c) => (
              <div key={c.title} className="landing-change">
                <h3>{c.title}</h3>
                <div>
                  <div className="landing-change-label">Avant</div>
                  <p className="landing-change-before">{c.before}</p>
                </div>
                <div>
                  <div className="landing-change-label landing-change-label--after">Avec Orgaly</div>
                  <p>{c.after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pour qui ──────────────────────────────────── */}
      <section className="landing-wrap landing-section landing-audience">
        <div>
          <h2>Pour qui ?</h2>
          <p className="landing-section-lead">
            Pour les commerces et les petites entreprises qui ont quelques salariés et un planning à
            tenir, avec ou sans personne dédiée aux ressources humaines.
          </p>
        </div>
        <ul aria-label="Exemples d'entreprises" className="landing-chips">
          {AUDIENCE.map((a) => <li key={a}>{a}</li>)}
        </ul>
      </section>

      {/* ── Tarif ─────────────────────────────────────── */}
      <section id="tarif" className="landing-wrap landing-pricing-wrap">
        <div className="landing-pricing">
          <div>
            <h2>Un tarif simple</h2>
            <p>Sans engagement, résiliable en ligne à tout moment.</p>
          </div>
          <div className="landing-prices">
            <div className="landing-price">
              <div className="landing-price-label">Jusqu'à {PRICING.freeEmployeeLimit} salariés</div>
              <div className="landing-price-value">Gratuit</div>
              <div className="landing-price-label">Toutes les fonctions, sans limite de durée.</div>
            </div>
            <div className="landing-price">
              <div className="landing-price-label">Au-delà de {PRICING.freeEmployeeLimit} salariés</div>
              <div className="landing-price-value">
                {PRICING.pricePerEmployee} <span>HT / salarié / mois</span>
              </div>
              <div className="landing-price-label">Le montant suit le nombre de salariés actifs.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bon à savoir ──────────────────────────────── */}
      <section className="landing-wrap landing-good-to-know">
        <h2>Bon à savoir</h2>
        <div className="landing-good-grid">
          <p>
            <strong>Les bulletins de paie sont indicatifs.</strong> Orgaly prépare des bulletins pour
            vous faire gagner du temps, mais ce n'est pas un logiciel de paie certifié : faites-les
            vérifier par votre expert-comptable.
          </p>
          <p>
            <strong>Vos données restent les vôtres.</strong> Vous pouvez les récupérer sur simple
            demande, et elles ne sont jamais revendues ni utilisées pour de la publicité.
          </p>
        </div>
      </section>

      <section className="landing-final">
        <div className="landing-wrap landing-final-inner">
          <h2>Le plus simple, c'est d'essayer avec votre propre équipe.</h2>
          <Link to="/setup/admin" className="landing-btn">Créer mon espace</Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-wrap landing-footer-inner">
          <span>© {new Date().getFullYear()} Orgaly</span>
          <nav aria-label="Informations légales" className="landing-footer-links">
            {LEGAL_PAGES.map((p) => <Link key={p.path} to={p.path}>{p.label}</Link>)}
          </nav>
        </div>
      </footer>
    </div>
  );
}
