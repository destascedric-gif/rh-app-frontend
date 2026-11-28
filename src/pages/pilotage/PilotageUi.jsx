import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOwnerActivity } from '../../api/owner';
import Select from '../../components/Select';
import {
  PERIODS, fmtDate, fmtEuro, fmtMonth, fmtWhen, activityLabel, daysAgo, isStale, plural, BILLING_STATES, healthItems,
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
  spark: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  phone: <><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18h2" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
};

export function Icon({ name, size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

// Bouton « i » (16 nov. 2026, pilotage compact) : les explications ne
// prennent plus de place, elles s'ouvrent au clic dans une petite bulle
// (refermée par un clic ailleurs ou la touche Échap).
export function InfoTip({ children, label = 'Explications', align = 'left', width = 420 }) {
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
    <span className="pil-info-wrap" ref={ref}>
      <button type="button" className={`pil-info${open ? ' open' : ''}`} aria-label={label} aria-expanded={open} onClick={() => setOpen((o) => !o)}>i</button>
      {open && <div className={`pil-pop pil-pop--${align}`} style={{ width }} role="dialog" aria-label={label}>{children}</div>}
    </span>
  );
}

// En-tête de page : titre (avec son « i » d'explications), lien de retour,
// actions à droite
export function PageHead({ title, sub, info, infoWidth, back, children }) {
  return (
    <header className="pil-page-head">
      <div>
        {back && <Link to={back.to} className="pil-back"><Icon name="back" size={14} />{back.label}</Link>}
        <h1>{title}{info && <InfoTip label={`À propos de « ${typeof title === 'string' ? title : 'cette page'} »`} width={infoWidth}>{info}</InfoTip>}</h1>
        {sub && <p className="pil-page-sub">{sub}</p>}
      </div>
      {children && <div className="pil-page-actions">{children}</div>}
    </header>
  );
}

// Titre de carte (sous-titre en petit sur la même ligne) ; avec « to », un
// petit bouton mène à la page de détail
export function CardHead({ title, sub, to, linkLabel = 'Détails', children }) {
  return (
    <div className="pil-card-head">
      <h2>
        {to ? <Link to={to} className="pil-title-link">{title}</Link> : title}
        {sub && <span className="pil-card-sub">{sub}</span>}
      </h2>
      <div className="pil-card-head-actions">
        {children}
        {to && <Link to={to} className="pil-more">{linkLabel} ›</Link>}
      </div>
    </div>
  );
}

// Bandeau de chiffres d'une ligne (remplace les grandes cases du haut).
// items : [{ icon, label, value, delta, muted, tone, to, onClick, grow, children }]
export function Strip({ items }) {
  return (
    <div className="pil-strip">
      {items.filter(Boolean).map((it) => {
        const body = (
          <>
            <div className="pil-strip-label">
              {it.tone ? <span className={`pil-dot pil-dot--${it.tone}`} /> : it.icon && <span className="pil-gold"><Icon name={it.icon} size={14} /></span>}
              {it.label}
            </div>
            {it.children ?? (
              <div className={`pil-strip-value${it.tone ? ` pil-st--${it.tone}` : ''}`}>
                {it.value}
                {it.delta && <small className={it.muted ? 'pil-strip-muted' : ''}>{it.delta}</small>}
              </div>
            )}
          </>
        );
        const style = it.grow ? { flex: it.grow } : undefined;
        if (it.to) return <Link key={it.label} to={it.to} className="pil-strip-cell pil-strip-cell--link" style={style}>{body}</Link>;
        if (it.onClick) return <button key={it.label} type="button" className="pil-strip-cell pil-strip-cell--link" style={style} onClick={it.onClick}>{body}</button>;
        return <div key={it.label} className="pil-strip-cell" style={style}>{body}</div>;
      })}
    </div>
  );
}

// Petit graphique sans axes (tuiles du tableau de bord)
export function Spark({ values, type = 'line', height = 44 }) {
  const W = 200, H = height;
  const max = Math.max(1, ...values);
  const n = values.length;
  if (n === 0) return null;
  if (type === 'bar') {
    const bw = W / n;
    return (
      <svg className="pil-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" height={H} aria-hidden="true">
        {values.map((v, i) => (v > 0 ? <rect key={i} x={i * bw + bw * 0.2} y={H - (v / max) * (H - 2)} width={bw * 0.6} height={(v / max) * (H - 2)} rx="1.5" fill="#C9A75A" /> : null))}
      </svg>
    );
  }
  const pts = values.map((v, i) => `${(i / Math.max(1, n - 1)) * W},${H - 2 - (v / max) * (H - 4)}`);
  return (
    <svg className="pil-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" height={H} aria-hidden="true">
      <path d={`M0,${H} L${pts.join(' L')} L${W},${H}Z`} fill="rgba(201,167,90,0.14)" />
      <path d={`M${pts.join(' L')}`} fill="none" stroke="#C9A75A" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
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

// Situation tarifaire : Gratuit / Offert (gris), Essai / Payant (doré)
export function PlanPill({ state }) {
  const info = BILLING_STATES[state] ?? BILLING_STATES.gratuit;
  return <span className={`pil-pill pil-pill--${info.paying ? 'pro' : 'free'}`}>{info.label}</span>;
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
// fill : le graphique prend toute la place libre de sa carte (largeur et
// hauteur mesurées), au lieu d'une hauteur fixe ; la carte doit être en
// colonne (classe pil-card--fill). height sert alors de hauteur minimale.
export function Chart({ series, type = 'line', xLabel, tip, height = 200, width = 560, ariaLabel, fill = false }) {
  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);
  const boxRef = useRef(null);
  const [box, setBox] = useState(null);
  useEffect(() => {
    if (!fill || !boxRef.current) return undefined;
    const el = boxRef.current;
    const ro = new ResizeObserver(() => {
      const w = Math.round(el.clientWidth), h = Math.round(el.clientHeight);
      if (w > 0 && h > 0) setBox((b) => (b && b.w === w && b.h === h ? b : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fill]);
  const W = fill && box ? box.w : width;
  const H = fill && box ? Math.max(height, box.h) : height;
  const x0 = 38, x1 = W - 12, y0 = H - 32, y1 = 14;
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
    <div ref={boxRef} className={`pil-chart${fill ? ' pil-chart--fill' : ''}`} style={fill ? { minHeight: height } : undefined}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" height={fill && box ? H : undefined} role="img" aria-label={ariaLabel}>
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
    { key: 'price_month', label: 'Formule' },
    { key: 'planning_months', label: 'Mois de planning' },
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
            <td><Link to={`/pilotage/entreprises/${c.id}`} className="pil-row-link" onClick={(e) => e.stopPropagation()}>{c.name}</Link>
              {c.ai_planning_enabled
                ? <span className="pil-ai-tag pil-ai-tag--on">IA</span>
                : c.ai_option_requested_at && <span className="pil-ai-tag">IA demandée</span>}
            </td>
            <td>{fmtDate(c.created_at)}</td>
            <td>{c.employees}</td>
            <td><PlanPill state={c.billing_state} />{c.price_month > 0 && <span className="pil-price"> {fmtEuro(c.price_month)}</span>}</td>
            <td>
              <span className={c.planning_months === 0 ? 'pil-zero' : ''}>{c.planning_months}</span>
              {c.planning_until && <span className="pil-price"> · jusqu’à {fmtMonth(c.planning_until)}</span>}
            </td>
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

// Jour d'une action, pour regrouper le journal : « Aujourd'hui », « Hier »,
// sinon « lundi 14 nov. »
const dayKey = (d) => new Date(d).toDateString();
const dayTitle = (d) => {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (date.toDateString() === today.toDateString()) return 'Aujourd’hui';
  if (date.toDateString() === yesterday.toDateString()) return 'Hier';
  const s = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const timeOf = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

// Lignes du journal (16 nov. 2026, choix B de Cédric) : pastille de couleur
// (verte = réussi, orange = refusé, rouge = erreur ; le mot s'affiche pour
// les refus et erreurs, au survol pour les réussites).
// grouped : regroupées par jour, les réussites en gris doux pour faire
// ressortir refus et erreurs.
export function JournalList({ entries, showCompany = true, grouped = false }) {
  const line = (e) => {
    const s = STATUS_INFO[e.status] ?? STATUS_INFO.ok;
    return (
      <li key={e.id} className={grouped && s.cls === 'ok' ? 'pil-journal-dim' : ''}>
        <span className="pil-journal-when">{grouped ? timeOf(e.created_at) : fmtWhen(e.created_at)}</span>
        <span className="pil-journal-what">
          {showCompany && <b>{e.company ?? 'Visiteur non connecté'}</b>}
          {e.actor && <span className="pil-journal-actor">{showCompany ? ' · ' : ''}{e.actor}</span>}
          {e.role && <span className="pil-journal-role">{e.actor ? ` (${e.role})` : `${showCompany ? ' · ' : ''}${e.role}`}</span>}
          <span className="pil-journal-action"> {e.label}</span>
        </span>
        <span className={`pil-st pil-st--${s.cls} pil-journal-st`} title={`${s.label}${e.http_status ? ` · code ${e.http_status}` : ''}`}>
          {s.cls !== 'ok' && s.label}<span className={`pil-dot pil-dot--${s.cls}`} aria-label={s.label} />
        </span>
      </li>
    );
  };
  if (!grouped) return <ul className="pil-journal">{entries.map(line)}</ul>;
  const groups = [];
  entries.forEach((e) => {
    const k = dayKey(e.created_at);
    if (!groups.length || groups[groups.length - 1].key !== k) groups.push({ key: k, title: dayTitle(e.created_at), items: [] });
    groups[groups.length - 1].items.push(e);
  });
  return groups.map((g) => {
    const issues = g.items.filter((e) => e.status !== 'ok').length;
    return (
      <div key={g.key}>
        <div className="pil-journal-day">
          {g.title} · {plural(g.items.length, 'action')}
          {issues > 0 && <span className="pil-journal-day-issues"> · {issues} refus ou erreur{issues > 1 ? 's' : ''}</span>}
        </div>
        <ul className="pil-journal">{g.items.map(line)}</ul>
      </div>
    );
  });
}

// Journal autonome : filtres, chargement, rafraîchissement chaque minute.
// compact : aperçu (quelques lignes, sans filtres, sans « Tout voir »).
// grouped : regroupé par jour. initialLimit + « Tout voir » : aperçu qui se
// déplie (fiche entreprise).
export function JournalCard({
  token, companies = [], companyId = '', status: statusProp, onStatus, compact = false,
  title = 'Journal des actions', to, linkLabel = 'Tout le journal', sub, pageSize = 100, hideFilters = false,
  grouped = false, initialLimit, className = '',
}) {
  const [ownStatus, setOwnStatus] = useState('all');
  const status = statusProp ?? ownStatus;
  const setStatus = onStatus ?? setOwnStatus;
  const [company, setCompany] = useState(companyId);
  const [limit, setLimit] = useState(initialLimit ?? (compact ? 7 : pageSize));
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

  const showFilters = !compact && !hideFilters && !initialLimit;
  const preview = !compact && Boolean(initialLimit) && limit === initialLimit;
  return (
    <section className={`pil-card ${className}`} id="pil-journal">
      <CardHead title={title} to={to} linkLabel={linkLabel} sub={sub}>
        {showFilters && (
          <div className="pil-journal-filters">
            {!companyId && companies.length > 0 && (
              <Select className="pil-oselect" panelClassName="pil-oselect-panel" value={company} onChange={(e) => setCompany(e.target.value)} aria-label="Entreprise">
                <option value="">Toutes les entreprises</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
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
        {preview && data && data.entries.length >= limit && (
          <button type="button" className="pil-more" onClick={() => setLimit(pageSize)}>Tout voir ›</button>
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
          <div className={compact || preview ? '' : 'pil-journal-scroll'}>
            <JournalList entries={data.entries} showCompany={!companyId} grouped={grouped} />
          </div>
          {!compact && !preview && data.entries.length >= limit && limit < 500 && (
            <button type="button" className="pil-link pil-load-more" onClick={() => setLimit(500)}>Afficher plus d’actions</button>
          )}
        </>
      )}
    </section>
  );
}

// ── Santé technique ──────────────────────────────────────────────────
// Tuile du tableau de bord : quatre lignes « pastille · nom · valeur »
export function HealthMini({ h, down }) {
  if (!h && !down) return <p className="pil-empty">Chargement…</p>;
  return (
    <ul className="pil-mini">
      {healthItems(h, down).map((it) => (
        <li key={it.key} title={it.detail}>
          <span className={`pil-dot pil-dot--${it.tone}`} />{it.short}
          <b className={`pil-st--${it.tone}`}>{it.value}</b>
        </li>
      ))}
    </ul>
  );
}
