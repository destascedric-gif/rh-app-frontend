import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOwnerStats } from '../../api/owner';
import { PageHead, CardHead, Kpi, CompaniesTable, Icon } from './PilotageUi';
import { STALE_DAYS, isStale, plural } from './pilotageUtils';

// Toutes les entreprises clientes : recherche, filtres, tri
const FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'active', label: 'Actives' },
  { key: 'stale', label: 'À relancer' },
  { key: 'free', label: 'Gratuit' },
  { key: 'pro', label: 'Pro' },
];
const MATCH = {
  all: () => true,
  active: (c) => !isStale(c.last_activity),
  stale: (c) => isStale(c.last_activity),
  free: (c) => c.plan !== 'pro',
  pro: (c) => c.plan === 'pro',
};

const compare = (key) => (a, b) => {
  const va = a[key], vb = b[key];
  if (key === 'name' || key === 'plan') return String(va).localeCompare(String(vb), 'fr');
  if (key === 'created_at' || key === 'last_activity') return (va ? new Date(va) : 0) - (vb ? new Date(vb) : 0);
  return (va ?? 0) - (vb ?? 0);
};

export default function PilEntreprises() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState({ key: 'last_activity', dir: 'desc' });

  useEffect(() => {
    let cancelled = false;
    getOwnerStats(30, token)
      .then((s) => { if (!cancelled) { setStats(s); setError(''); } })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [token]);

  const rows = useMemo(() => {
    if (!stats) return [];
    const q = query.trim().toLowerCase();
    const list = stats.companies.filter((c) => MATCH[filter](c) && (!q || c.name.toLowerCase().includes(q)));
    const sorted = [...list].sort(compare(sort.key));
    return sort.dir === 'desc' ? sorted.reverse() : sorted;
  }, [stats, query, filter, sort]);

  const onSort = (key) => setSort((s) => (s.key === key
    ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
    : { key, dir: key === 'name' || key === 'plan' ? 'asc' : 'desc' }));

  const companies = stats?.companies ?? [];
  const active = companies.filter((c) => !isStale(c.last_activity)).length;

  return (
    <>
      <PageHead title="Entreprises" sub="Toutes les entreprises clientes (compte démo exclu). Cliquez sur une entreprise pour sa fiche." />

      {error && <div className="pil-card pil-error">{error}</div>}
      {!stats && !error && <div className="pil-loading">Chargement…</div>}

      {stats && (
        <>
          <div className="pil-kpis pil-kpis--3">
            <Kpi icon="store" label="Entreprises inscrites" value={stats.totals.companies} delta={`+${stats.totals.new_companies} sur 30 jours`} />
            <Kpi icon="check" label="Actives" value={active} delta={`activité depuis moins de ${STALE_DAYS} jours`} />
            <Kpi icon="alert" label="À relancer" value={companies.length - active} delta={`sans activité depuis ${STALE_DAYS} jours`} muted />
          </div>


          <section className="pil-card">
            <CardHead title="Liste des entreprises" sub={`${plural(rows.length, 'entreprise')} affichée${rows.length > 1 ? 's' : ''} · cliquez sur un titre de colonne pour trier`}>
              <label className="pil-search">
                <Icon name="search" size={14} />
                <input type="search" placeholder="Rechercher" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Rechercher une entreprise" />
              </label>
              <div className="pil-seg pil-seg--small" role="group" aria-label="Filtrer">
                {FILTERS.map((f) => (
                  <button key={f.key} type="button" className={f.key === filter ? 'on' : ''} aria-pressed={f.key === filter} onClick={() => setFilter(f.key)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </CardHead>
            {rows.length === 0
              ? <p className="pil-empty">Aucune entreprise ne correspond.</p>
              : <CompaniesTable companies={rows} sort={sort} onSort={onSort} />}
          </section>
        </>
      )}
    </>
  );
}
