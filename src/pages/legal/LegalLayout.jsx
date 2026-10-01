import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { LEGAL_PAGES, LEGAL_UPDATED_AT } from '../../legal/legalInfo';

// Valeur d'identité encore inconnue : visible à l'écran pour ne pas publier
// une page légale incomplète sans s'en apercevoir.
export const Field = ({ value, label }) =>
  value ? <>{value}</> : <mark className="legal-todo">[à compléter : {label}]</mark>;

export default function LegalLayout({ title, children }) {
  useEffect(() => {
    document.title = `${title} — Orgaly`;
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link to="/" className="legal-brand">Orgaly</Link>
        <nav className="legal-nav" aria-label="Documents légaux">
          {LEGAL_PAGES.map((p) => (
            <NavLink key={p.path} to={p.path} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {p.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <article className="legal-content">
        <h1>{title}</h1>
        <p className="legal-updated">Version en vigueur au {LEGAL_UPDATED_AT}</p>
        {children}
      </article>
    </div>
  );
}

// Liens discrets vers les documents légaux (pages d'auth, barre latérale)
export const LegalLinks = ({ className = 'legal-links' }) => (
  <div className={className}>
    {LEGAL_PAGES.map((p) => <Link key={p.path} to={p.path}>{p.label}</Link>)}
  </div>
);
