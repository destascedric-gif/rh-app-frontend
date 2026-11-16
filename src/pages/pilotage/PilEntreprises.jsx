import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOwnerStats } from '../../api/owner';
import { PageHead, CompaniesTable, Icon } from './PilotageUi';
import { STALE_DAYS, isStale, isPaying } from './pilotageUtils';

// Toutes les entreprises clientes : recherche, filtres, tri
const FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'active', label: 'Actives' },
  { key: 'stale', label: 'À relancer' },
  { key: 'free', label: 'Gratuites' },
  { key: 'pro', label: 'Payantes' },
];
const MATCH = {
  all: () => true,
  active: (c) => !isStale(c.last_activity),
  stale: (c) => isStale(c.last_activity),
  free: (c) => !isPaying(c),
  pro: (c) => isPaying(c),
};

// Option IA avancée (16 nov. 2026) : pour activer ou relancer
const AI_FILTERS = [
  { key: 'all', label: 'IA : toutes' },
  { key: 'on', label: 'Activée' },
  { key: 'asked', label: 'Demandée' },
  { key: 'none', label: 'Sans' },
];
const AI_MATCH = {
  all: () => true,
  on: (c) => c.ai_planning_enabled,
  asked: (c) => !c.ai_planning_enabled && Boolean(c.ai_option_requested_at),
  none: (c) => !c.ai_planning_enabled && !c.ai_option_requested_at,
};

const compare = (key) => (a, b) => {
  const va = a[key], vb = b[key];
  if (key === 'name') return String(va).localeCompare(String(vb), 'fr');
  if (key === 'created_at' || key === 'last_activity') return (va ? new Date(va) : 0) - (vb ? new Date(vb) : 0);
  return (va ?? 0) - (vb ?? 0);
};

export default function PilEntreprises() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [aiFilter, setAiFilter] = useState('all');
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
    const list = stats.companies.filter((c) => MATCH[filter](c) && AI_MATCH[aiFilter](c) && (!q || c.name.toLowerCase().includes(q)));
    const sorted = [...list].sort(compare(sort.key));
    return sort.dir === 'desc' ? sorted.reverse() : sorted;
  }, [stats, query, filter, aiFilter, sort]);

  const onSort = (key) => setSort((s) => (s.key === key
    ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
    : { key, dir: key === 'name' ? 'asc' : 'desc' }));

  const companies = stats?.companies ?? [];
  // Nombre d'entreprises de chaque filtre (remplace les grandes cases du haut)
  const count = (match) => companies.filter(match).length;

  return (
    <>
      <PageHead
        title="Entreprises"
        info={<p>Toutes les entreprises clientes (compte démo exclu). Cliquez sur une entreprise pour sa fiche, ou sur un titre de colonne pour trier. « À relancer » : sans activité depuis {STALE_DAYS} jours. +{stats?.totals.new_companies ?? 0} inscriptions sur 30 jours.</p>}
      />

      {error && <div className="pil-card pil-error">{error}</div>}
      {!stats && !error && <div className="pil-loading">Chargement…</div>}

      {stats && (
        <section className="pil-card">
          <div className="pil-card-head">
            <div className="pil-card-head-actions">
              <label className="pil-search">
                <Icon name="search" size={14} />
                <input type="search" placeholder="Rechercher" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Rechercher une entreprise" />
              </label>
              <div className="pil-seg pil-seg--small" role="group" aria-label="Filtrer">
                {FILTERS.map((f) => (
                  <button key={f.key} type="button" className={f.key === filter ? 'on' : ''} aria-pressed={f.key === filter} onClick={() => setFilter(f.key)}>
                    {f.label}<span className="pil-seg-n">{count(MATCH[f.key])}</span>
                  </button>
                ))}
              </div>
              <div className="pil-seg pil-seg--small" role="group" aria-label="Filtrer selon l’option IA">
                {AI_FILTERS.map((f) => {
                  const n = f.key === 'asked' ? count(AI_MATCH.asked) : 0;
                  return (
                    <button key={f.key} type="button" className={f.key === aiFilter ? 'on' : ''} aria-pressed={f.key === aiFilter} onClick={() => setAiFilter(f.key)}>
                      {f.label}
                      {n > 0 && <span className="pil-seg-count">{n}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          {rows.length === 0
            ? <p className="pil-empty">Aucune entreprise ne correspond.</p>
            : <CompaniesTable companies={rows} sort={sort} onSort={onSort} />}
        </section>
      )}
    </>
  );
}
