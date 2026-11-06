import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOwnerActivity } from '../../api/owner';
import {
  PERIODS, fmtDate, fmtWhen, fmtUptime, activityLabel, daysAgo, isStale, plural,
} from './pilotageUtils';

// Briques d'affichage communes aux pages de pilotage (noir et or)

const ICONS = {
  home: <><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /></>,
  store: <><path d="M3 9l1.5-5h15L21 9" /><path d="M4 9v11h16V9" /><path d="M9 20v-6h6v6" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><circle cx="17.5" cy="8.5" r="2.4" /><path d="M15.7 14.7c2.7.3 4.6 2.2 4.8 5" /></>,
  crown: <><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" /></>,
  euro: <><path d="M17 6.5A7 7 0 1 0 17 17.5" /><path d="M4 10.5h9M4 13.5h9" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></>,
  alert: <><path d="M12 3 2 20h20L12 3z" /><path d="M12 10v4M12 17h.01" /></>,
  block: <><circle cx="12" cy="12" r="9" /><path d="m5.7 5.7 12.6 12.6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6 8.5 7 8.5-7" /></>,
  list: <><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
  pulse: <><path d="M3 12h4l3-7 4 14 3-7h4" /></>,
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  back: <><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  mailIn: <><path d="M4 4h16v16H4z" /><path d="M4 13h4l2 3h4l2-3h4" /></>,
  logout: <><path d="M15 4h4v16h-4" /><path d="M10 8l-4 4 4 4" /><path d="M6 12h10" /></>,
};

export function Icon({ name, size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

// En-tête de page : titre, sous-titre, lien de retour, actions à droite
export function PageHead({ title, sub, back, children }) {
  return (
    <header className="pil-page-head">
      <div>
        {back && <Link to={back.to} className="pil-back"><Icon name="back" size={14} />{back.label}</Link>}
        <h1>{title}</h1>
        {sub && <p className="pil-page-sub">{sub}</p>}
      </div>
      {children && <div className="pil-page-actions">{children}</div>}
    </header>
  );
}

// Titre de carte ; avec « to », la carte mène à sa page de détail
export function CardHead({ title, sub, to, linkLabel = 'Voir le détail', children }) {
  return (
    <div className="pil-card-head">
      <div>
        <h2>{to ? <Link to={to} className="pil-title-link">{title}</Link> : title}</h2>
        {sub && <p className="pil-sub">{sub}</p>}
      </div>
      <div className="pil-card-head-actions">
        {children}
        {to && <Link to={to} className="pil-more">{linkLabel}<Icon name="arrow" size={13} /></Link>}
      </div>
    </div>
  );
}

export function Kpi({ icon, label, value, delta, muted, to }) {
  const body = (
    <>
      <div className="pil-kpi-label"><span className="pil-gold"><Icon name={icon} /></span>{label}</div>
      <div className="pil-kpi-value">{value}</div>
      <div className={`pil-kpi-delta${muted ? ' pil-kpi-delta--muted' : ''}`}>{delta}</div>
    </>
  );
  return to
    ? <Link to={to} className="pil-card pil-kpi pil-kpi--link">{body}</Link>
    : <div className="pil-card pil-kpi">{body}</div>;
}

export function PeriodSeg({ days, onChange }) {
  return (
    <div className="pil-seg" role="group" aria-label="Période">
      {PERIODS.map((p) => (
        <button key={p.days} type="button" className={p.days === days ? 'on' : ''} aria-pressed={p.days === days} onClick={() => onChange(p.days)}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function PlanPill({ plan }) {
  return <span className={`pil-pill pil-pill--${plan === 'pro' ? 'pro' : 'free'}`}>{plan === 'pro' ? 'Pro' : 'Gratuit'}</span>;
}

export function ActivityStatus({ date }) {
  const stale = isStale(date);
  return (
    <span className={`pil-st pil-st--${stale ? 'warn' : 'ok'}`}>
      <Icon name={stale ? 'alert' : 'check'} />
      {stale ? `à relancer${date ? ` · ${daysAgo(date)} j` : ''}` : activityLabel(date)}
    </span>
  );
}

// Courbe (line) ou barres (bar), avec repère et bulle au survol.
// series : [{ bucket, value }] ; xLabel(bucket) ; tip(point) -> texte
export function Chart({ series, type = 'line', xLabel, tip, height = 200, width = 560, ariaLabel }) {
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const W = width, H = height, x0 = 38, x1 = width - 12, y0 = H - 32, y1 = 14;
  const values = series.map((s) => s.value ?? 0);
  const max = Math.max(2, ...values);
  const step = max <= 4 ? 1 : Math.ceil(max / 4 / (max > 40 ? 10 : 1)) * (max > 40 ? 10 : 1);
  const top = Math.ceil(max / step) * step;
  const n = series.length;
  const slot = (x1 - x0) / Math.max(1, n);
  const X = type === 'bar'
    ? (i) => x0 + slot * (i + 0.5)
    : (i) => x0 + ((x1 - x0) * i) / Math.max(1, n - 1);
  const Y = (v) => y0 - ((y0 - y1) * (v ?? 0)) / top;
  const pts = series.map((s, i) => `${X(i)},${Y(s.value)}`);
  const ticks = n <= 7 ? series.map((_, i) => i) : [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (n - 1)));

  const onMove = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    const sx = ((e.clientX - r.left) * W) / r.width;
    const i = type === 'bar'
      ? Math.floor((sx - x0) / slot)
      : Math.round(((sx - x0) / (x1 - x0)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const grid = [];
  for (let v = 0; v <= top; v += step) grid.push(v);
  const barW = Math.max(3, Math.min(26, slot * 0.6));

  return (
    <div className="pil-chart">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={ariaLabel}>
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
        {type === 'line' ? (
          <>
            <path d={`M${x0},${y0} L${pts.join(' L')} L${x1},${y0} Z`} fill="url(#pil-fill)" />
            <path d={`M${pts.join(' L')}`} fill="none" stroke="#C9A75A" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          </>
        ) : (
          series.map((s, i) => (s.value > 0 ? (
            <rect key={s.bucket} x={X(i) - barW / 2} y={Y(s.value)} width={barW} height={y0 - Y(s.value)} rx="2"
              fill={hover === i ? '#E3C67E' : '#C9A75A'} />
          ) : null))
        )}
        {ticks.map((i) => (
          <text key={i} x={X(i)} y={H - 10} textAnchor={type === 'line' && i === 0 ? 'start' : type === 'line' && i === n - 1 ? 'end' : 'middle'} fontSize="11" fill="#6F6C66">
            {xLabel(series[i].bucket)}
          </text>
        ))}
        {hover !== null && type === 'line' && (
          <>
            <line x1={X(hover)} x2={X(hover)} y1={y1} y2={y0} stroke="#4A4740" strokeWidth="1" />
            <circle cx={X(hover)} cy={Y(series[hover].value)} r="4" fill="#C9A75A" stroke="#141413" strokeWidth="2" />
          </>
        )}
        <rect x={x0 - 4} y="0" width={x1 - x0 + 8} height={y0 + 4} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>
      {hover !== null && (
        <div className="pil-tip" style={{ left: `${Math.min(72, (X(hover) / W) * 100)}%` }}>
          {tip(series[hover])}
        </div>
      )}
    </div>
  );
}

// Tableau des entreprises : une ligne mène à la fiche de l'entreprise
export function CompaniesTable({ companies, sort, onSort }) {
  const navigate = useNavigate();
  const cols = [
    { key: 'name', label: 'Entreprise' },
    { key: 'created_at', label: 'Inscrite le' },
    { key: 'employees', label: 'Salariés' },
    { key: 'plan', label: 'Formule' },
    { key: 'shifts_30d', label: 'Créneaux (30 j)' },
    { key: 'last_activity', label: 'Dernière activité' },
  ];
  return (
    <table className="pil-table pil-table--rows">
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c.key} aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
              {onSort ? (
                <button type="button" className="pil-sort" onClick={() => onSort(c.key)}>
                  {c.label}{sort?.key === c.key && <span aria-hidden="true">{sort.dir === 'asc' ? ' ▲' : ' ▼'}</span>}
                </button>
              ) : c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {companies.map((c) => (
          <tr key={c.id} onClick={() => navigate(`/pilotage/entreprises/${c.id}`)}>
            <td><Link to={`/pilotage/entreprises/${c.id}`} className="pil-row-link" onClick={(e) => e.stopPropagation()}>{c.name}</Link></td>
            <td>{fmtDate(c.created_at)}</td>
            <td>{c.employees}</td>
            <td><PlanPill plan={c.plan} /></td>
            <td>{c.shifts_30d}</td>
            <td><ActivityStatus date={c.last_activity} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Journal des actions ──────────────────────────────────────────────
const STATUS_FILTERS = [
  { key: 'all', label: 'Tout' },
  { key: 'refused', label: 'Refusées' },
  { key: 'error', label: 'Erreurs' },
];
const STATUS_INFO = {
  ok: { label: 'réussi', cls: 'ok', icon: 'check' },
  refused: { label: 'refusé', cls: 'warn', icon: 'block' },
  error: { label: 'erreur', cls: 'bad', icon: 'alert' },
};

export function JournalList({ entries, showCompany = true }) {
  return (
    <ul className="pil-journal">
      {entries.map((e) => {
        const s = STATUS_INFO[e.status] ?? STATUS_INFO.ok;
        return (
          <li key={e.id}>
            <span className="pil-journal-when">{fmtWhen(e.created_at)}</span>
            <span className="pil-journal-what">
              {showCompany && <b>{e.company ?? 'Visiteur non connecté'}</b>}
              {e.role && <span className="pil-journal-role">{showCompany ? ' · ' : ''}{e.role}</span>}
              <span className="pil-journal-action"> {e.label}</span>
            </span>
            <span className={`pil-st pil-st--${s.cls}`} title={e.http_status ? `Code ${e.http_status}` : undefined}>
              <Icon name={s.icon} />{s.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// Journal autonome : filtres, chargement, rafraîchissement chaque minute.
// compact : aperçu du tableau de bord (quelques lignes, sans filtres).
export function JournalCard({
  token, companies = [], companyId = '', status: statusProp, onStatus, compact = false,
  title = 'Journal des actions', to, sub, pageSize = 100, hideFilters = false,
}) {
  const [ownStatus, setOwnStatus] = useState('all');
  const status = statusProp ?? ownStatus;
  const setStatus = onStatus ?? setOwnStatus;
  const [company, setCompany] = useState(companyId);
  const [limit, setLimit] = useState(compact ? 7 : pageSize);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((k) => k + 1), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = { limit };
    if (status !== 'all') params.status = status;
    if (company) params.company = company;
    getOwnerActivity(params, token)
      .then((d) => { if (!cancelled) { setData(d); setError(''); } })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [token, status, company, limit, tick]);

  const showFilters = !compact && !hideFilters;
  return (
    <section className="pil-card" id="pil-journal">
      <CardHead
        title={title}
        to={to}
        linkLabel="Tout le journal"
        sub={sub ?? `Qui a fait quoi, sans le contenu · effacé au bout de ${data?.retention_days ?? 90} jours`}
      >
        {showFilters && (
          <div className="pil-journal-filters">
            {!companyId && companies.length > 0 && (
              <select className="pil-select" value={company} onChange={(e) => setCompany(e.target.value)} aria-label="Entreprise">
                <option value="">Toutes les entreprises</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            <div className="pil-seg pil-seg--small" role="group" aria-label="Résultat">
              {STATUS_FILTERS.map((f) => (
                <button key={f.key} type="button" className={f.key === status ? 'on' : ''} aria-pressed={f.key === status} onClick={() => setStatus(f.key)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardHead>

      {error && <p className="pil-error">{error}</p>}
      {!data && !error && <p className="pil-empty">Chargement…</p>}
      {data && data.entries.length === 0 && (
        <p className="pil-empty">
          {status === 'error' ? 'Aucune erreur enregistrée.' : status === 'refused' ? 'Aucune action refusée.' : 'Aucune action enregistrée pour l’instant.'}
        </p>
      )}
      {data && data.entries.length > 0 && (
        <>
          <div className={compact ? '' : 'pil-journal-scroll'}>
            <JournalList entries={data.entries} showCompany={!companyId} />
          </div>
          {!compact && data.entries.length >= limit && limit < 500 && (
            <button type="button" className="pil-link pil-load-more" onClick={() => setLimit(500)}>Afficher plus d’actions</button>
          )}
        </>
      )}
    </section>
  );
}

// ── Santé technique ──────────────────────────────────────────────────
function HealthRow({ tone, icon, label, value, detail, children }) {
  return (
    <div className="pil-health-row">
      <span className={`pil-health-icon pil-st--${tone}`}><Icon name={icon} /></span>
      <div className="pil-health-body">
        <div className="pil-health-label">{label}</div>
        {detail && <div className="pil-health-detail">{detail}</div>}
        {children}
      </div>
      <div className={`pil-health-value pil-st--${tone}`}>{value}</div>
    </div>
  );
}

export function HealthRows({ h, down, onShowErrors }) {
  if (down) {
    return (
      <HealthRow tone="bad" icon="alert" label="Serveur injoignable" value="hors ligne"
        detail="La page ne parvient pas à joindre le serveur d’Orgaly." />
    );
  }
  if (!h) return <p className="pil-empty">Chargement…</p>;

  const speedTone = !h.avg_ms ? 'ok' : h.avg_ms < 500 ? 'ok' : h.avg_ms < 1500 ? 'warn' : 'bad';
  const mailShare = Math.min(100, Math.round((h.emails_today / h.email_daily_limit) * 100));
  const mailTone = mailShare >= 90 || h.email_errors_24h > 0 ? 'bad' : mailShare >= 70 ? 'warn' : 'ok';
  const partialDay = h.uptime_s < 86400;

  return (
    <div className="pil-health">
      <HealthRow tone="ok" icon="check" label="Site et serveur" value="en ligne"
        detail={`Redémarré il y a ${fmtUptime(h.uptime_s)}`} />
      <HealthRow tone={speedTone} icon="clock" label="Temps de réponse moyen"
        value={h.avg_ms == null ? '—' : `${h.avg_ms} ms`}
        detail={`${plural(h.requests_24h, 'requête')}${partialDay ? ' depuis le redémarrage' : ''}`} />
      <HealthRow tone={h.errors_24h > 0 ? 'bad' : 'ok'} icon={h.errors_24h > 0 ? 'alert' : 'check'}
        label="Erreurs du serveur" value={h.errors_24h}
        detail={h.last_error_at ? `Dernière : ${fmtWhen(h.last_error_at)}` : 'Aucune erreur enregistrée'}>
        {h.errors_24h > 0 && onShowErrors && <button type="button" className="pil-link" onClick={onShowErrors}>Voir les erreurs</button>}
      </HealthRow>
      <HealthRow tone={mailTone} icon="mail" label="E-mails envoyés aujourd’hui"
        value={`${h.emails_today} / ${h.email_daily_limit}`}
        detail={h.email_errors_24h > 0
          ? `${plural(h.email_errors_24h, 'envoi')} en échec (24 h)`
          : 'Limite quotidienne de l’offre gratuite Brevo'}>
        <div className="pil-meter" aria-hidden="true"><div style={{ width: `${mailShare}%` }} className={`pil-meter--${mailTone}`} /></div>
      </HealthRow>
    </div>
  );
}
