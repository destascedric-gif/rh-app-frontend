import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOwnerStats } from '../../api/owner';
import BrandMark from '../../components/BrandMark';
import './Pilotage.css';

// Page de pilotage d'Orgaly, réservée au propriétaire : chiffres globaux,
// sans jamais afficher le contenu des comptes clients.

const PERIODS = [
  { days: 7, label: '7 jours', since: 'sur 7 jours' },
  { days: 30, label: '30 jours', since: 'sur 30 jours' },
  { days: 365, label: '12 mois', since: 'sur 12 mois' },
];
// Au-delà de ce nombre de jours sans activité, l'entreprise est à relancer
const STALE_DAYS = 14;

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const daysAgo = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
const activityLabel = (d) => {
  if (!d) return null;
  const n = daysAgo(d);
  return n <= 0 ? "aujourd'hui" : n === 1 ? 'hier' : `il y a ${n} j`;
};

const Icon = ({ path }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
);
const ICONS = {
  store: <><path d="M3 9l1.5-5h15L21 9" /><path d="M4 9v11h16V9" /><path d="M9 20v-6h6v6" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><circle cx="17.5" cy="8.5" r="2.4" /><path d="M15.7 14.7c2.7.3 4.6 2.2 4.8 5" /></>,
  crown: <><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" /></>,
  euro: <><path d="M17 6.5A7 7 0 1 0 17 17.5" /><path d="M4 10.5h9M4 13.5h9" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  alert: <><path d="M12 3 2 20h20L12 3z" /><path d="M12 10v4M12 17h.01" /></>,
};

function Kpi({ icon, label, value, delta, muted }) {
  return (
    <div className="pil-card pil-kpi">
      <div className="pil-kpi-label"><span className="pil-gold"><Icon path={ICONS[icon]} /></span>{label}</div>
      <div className="pil-kpi-value">{value}</div>
      <div className={`pil-kpi-delta${muted ? ' pil-kpi-delta--muted' : ''}`}>{delta}</div>
    </div>
  );
}

// Courbe des inscriptions, avec repère et bulle au survol
function SignupChart({ series, monthly }) {
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const W = 560, H = 200, x0 = 34, x1 = 548, y0 = 168, y1 = 14;
  const max = Math.max(2, ...series.map((s) => s.count));
  const step = max <= 4 ? 1 : Math.ceil(max / 4);
  const top = Math.ceil(max / step) * step;
  const X = (i) => x0 + ((x1 - x0) * i) / Math.max(1, series.length - 1);
  const Y = (v) => y0 - ((y0 - y1) * v) / top;
  const pts = series.map((s, i) => `${X(i)},${Y(s.count)}`);
  const label = (b) => (monthly
    ? new Date(`${b}T12:00:00`).toLocaleDateString('fr-FR', { month: 'short' })
    : fmtDate(`${b}T12:00:00`));
  const ticks = series.length <= 7 ? series.map((_, i) => i) : [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (series.length - 1)));

  const onMove = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    const sx = ((e.clientX - r.left) * W) / r.width;
    const i = Math.round(((sx - x0) / (x1 - x0)) * (series.length - 1));
    setHover(Math.max(0, Math.min(series.length - 1, i)));
  };

  const grid = [];
  for (let v = 0; v <= top; v += step) grid.push(v);

  return (
    <div className="pil-chart">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Courbe des inscriptions">
        <defs>
          <linearGradient id="pil-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#C9A75A" stopOpacity="0.22" />
            <stop offset="1" stopColor="#C9A75A" stopOpacity="0" />
          </linearGradient>
        </defs>
        {grid.map((v) => (
          <g key={v}>
            <line x1={x0} x2={x1} y1={Y(v)} y2={Y(v)} stroke="#262522" strokeWidth="0.5" />
            <text x={x0 - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="#6F6C66">{v}</text>
          </g>
        ))}
        <path d={`M${x0},${y0} L${pts.join(' L')} L${x1},${y0} Z`} fill="url(#pil-fill)" />
        <path d={`M${pts.join(' L')}`} fill="none" stroke="#C9A75A" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {ticks.map((i) => (
          <text key={i} x={X(i)} y={H - 10} textAnchor={i === 0 ? 'start' : i === series.length - 1 ? 'end' : 'middle'} fontSize="11" fill="#6F6C66">{label(series[i].bucket)}</text>
        ))}
        {hover !== null && (
          <>
            <line x1={X(hover)} x2={X(hover)} y1={y1} y2={y0} stroke="#4A4740" strokeWidth="1" />
            <circle cx={X(hover)} cy={Y(series[hover].count)} r="4" fill="#C9A75A" stroke="#141413" strokeWidth="2" />
          </>
        )}
        <rect x={x0 - 4} y="0" width={x1 - x0 + 8} height={y0 + 4} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>
      {hover !== null && (
        <div className="pil-tip" style={{ left: `${Math.min(78, (X(hover) / W) * 100)}%` }}>
          {label(series[hover].bucket)} · {series[hover].count} inscription{series[hover].count > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export default function Pilotage() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { document.title = 'Pilotage — Orgaly'; }, []);

  useEffect(() => {
    let cancelled = false;
    getOwnerStats(days, token)
      .then((s) => { if (!cancelled) { setStats(s); setError(''); } })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [days, token]);

  const period = PERIODS.find((p) => p.days === days);
  const handleLogout = () => { logout(); navigate('/login'); };

  const t = stats?.totals;
  const total = stats ? stats.plans.free + stats.plans.pro : 0;
  const proShare = total ? Math.round((stats.plans.pro / total) * 100) : 0;

  return (
    <div className="pil">
      <div className="pil-inner">
        <header className="pil-top">
          <div className="pil-brand">
            <BrandMark size={26} color="#C9A75A" />
            <div>
              <div className="pil-title">Pilotage Orgaly</div>
              <div className="pil-hello">Bonjour {user?.firstName || 'Cédric'}</div>
            </div>
          </div>
          <div className="pil-top-actions">
            <div className="pil-seg" role="group" aria-label="Période">
              {PERIODS.map((p) => (
                <button key={p.days} type="button" className={p.days === days ? 'on' : ''} aria-pressed={p.days === days} onClick={() => setDays(p.days)}>
                  {p.label}
                </button>
              ))}
            </div>
            <button type="button" className="pil-logout" onClick={handleLogout}>Se déconnecter</button>
          </div>
        </header>

        {error && <div className="pil-card pil-error">{error}</div>}
        {!stats && !error && <div className="pil-loading">Chargement…</div>}

        {stats && (
          <>
            <div className="pil-kpis">
              <Kpi icon="store" label="Entreprises inscrites" value={t.companies} delta={`+${t.new_companies} ${period.since}`} />
              <Kpi icon="users" label="Salariés actifs" value={t.employees} delta={`+${t.new_employees} ${period.since}`} />
              <Kpi icon="crown" label="Entreprises en Pro" value={t.pro_companies} delta={`${proShare} % des entreprises`} />
              <Kpi icon="euro" label="Revenus du mois" value="—" delta="dès que Stripe sera branché" muted />
            </div>

            <div className="pil-row">
              <section className="pil-card">
                <h2>Nouvelles inscriptions</h2>
                <p className="pil-sub">Entreprises créées {days === 365 ? 'par mois, 12 derniers mois' : `par jour, ${days} derniers jours`}</p>
                <SignupChart series={stats.series} monthly={days === 365} />
              </section>

              <section className="pil-card">
                <h2>Formules</h2>
                <p className="pil-sub">{total} entreprise{total > 1 ? 's' : ''} au total</p>
                <div className="pil-bar" aria-hidden="true">
                  {stats.plans.free > 0 && <div className="pil-bar-free" style={{ flex: stats.plans.free }} />}
                  {stats.plans.pro > 0 && <div className="pil-bar-pro" style={{ flex: stats.plans.pro }} />}
                </div>
                <div className="pil-legend">
                  <span><i className="pil-sw pil-sw--free" />Gratuit <b>{stats.plans.free}</b></span>
                  <span><i className="pil-sw pil-sw--pro" />Pro <b>{stats.plans.pro}</b></span>
                </div>
                <p className="pil-sub pil-sub--spaced">Proches de la limite gratuite ({stats.free_limit} salariés)</p>
                {stats.near_limit.length === 0
                  ? <p className="pil-empty">Aucune pour l'instant.</p>
                  : (
                    <ul className="pil-near">
                      {stats.near_limit.map((c) => (
                        <li key={c.id}>{c.name} · <b>{c.employees}</b>/{stats.free_limit}</li>
                      ))}
                    </ul>
                  )}
              </section>
            </div>

            <section className="pil-card">
              <h2>Activité des entreprises</h2>
              <p className="pil-sub">Pour repérer celles qui utilisent vraiment Orgaly, et celles à relancer (sans activité depuis {STALE_DAYS} jours)</p>
              {stats.companies.length === 0 ? (
                <p className="pil-empty">Aucune entreprise inscrite pour l'instant.</p>
              ) : (
                <table className="pil-table">
                  <thead>
                    <tr><th>Entreprise</th><th>Inscrite le</th><th>Salariés</th><th>Formule</th><th>Créneaux (30 j)</th><th>Dernière activité</th></tr>
                  </thead>
                  <tbody>
                    {stats.companies.map((c) => {
                      const stale = !c.last_activity || daysAgo(c.last_activity) > STALE_DAYS;
                      return (
                        <tr key={c.id}>
                          <td>{c.name}</td>
                          <td>{fmtDate(c.created_at)}</td>
                          <td>{c.employees}</td>
                          <td><span className={`pil-pill pil-pill--${c.plan === 'pro' ? 'pro' : 'free'}`}>{c.plan === 'pro' ? 'Pro' : 'Gratuit'}</span></td>
                          <td>{c.shifts_30d}</td>
                          <td>
                            <span className={`pil-st pil-st--${stale ? 'warn' : 'ok'}`}>
                              <Icon path={stale ? ICONS.alert : ICONS.check} />
                              {stale
                                ? `à relancer${c.last_activity ? ` · ${daysAgo(c.last_activity)} j` : ''}`
                                : activityLabel(c.last_activity)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>

            <div className="pil-row pil-row--even">
              <section className="pil-card pil-soon">
                <h2>Journal des actions</h2>
                <p className="pil-sub">Qui a fait quoi, sans le contenu · gardé 90 jours</p>
                <p className="pil-empty">Arrive à l'étape 2.</p>
              </section>
              <section className="pil-card pil-soon">
                <h2>Santé technique</h2>
                <p className="pil-sub">Dernières 24 heures</p>
                <p className="pil-empty">Arrive à l'étape 2.</p>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
