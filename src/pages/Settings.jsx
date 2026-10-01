import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSettings, updateSettings } from '../api/settings';
import { changePassword } from '../api/auth';
import { getShiftTemplates, createShiftTemplate, updateShiftTemplate, deleteShiftTemplate } from '../api/shiftTemplates';
import PageHeader from '../components/PageHeader';
import { SHIFT_PALETTE, NEUTRAL_SHIFT_COLOR } from '../components/schedule/shiftColor';

const EMPTY_PASSWORD_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };
// color vide = couleur libre attribuée automatiquement par le serveur
const EMPTY_TEMPLATE_FORM = { name: '', startTime: '', endTime: '', breakStart: '', breakEnd: '', color: '' };
const formatTime = (t) => t ? t.slice(0, 5) : '';
// Couleur principale d'origine d'Orgaly (valeur par défaut en base)
const DEFAULT_PRIMARY_COLOR = '#1C4ED8';
const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
// Règles par défaut du Code du travail (le serveur refuse moins favorable
// que les minimums légaux) : s'en écarter n'est légitime qu'avec une
// convention collective ou un accord d'entreprise.
const LEGAL_DEFAULTS = {
  leaveAccrualPerMonth:        2.08,
  overtimeTier1Rate:           1.25,
  overtimeTier2Rate:           1.5,
  overtimeTier2ThresholdHours: 43,
};

// "1.25" → "+25 %", "2.5" → "2,5"
const ratePercent = (rate) => `+${Math.round((Number(rate) - 1) * 100)} %`;
const frNumber = (n) => String(Number(n)).replace('.', ',');

const toForm = (data) => ({
  defaultWeeklyHours:          data.default_weekly_hours,
  leaveAccrualPerMonth:        data.leave_accrual_per_month,
  overtimeTier1Rate:           data.overtime_tier1_rate,
  overtimeTier2Rate:           data.overtime_tier2_rate,
  overtimeTier2ThresholdHours: data.overtime_tier2_threshold_hours,
  primaryColor:                data.primary_color || DEFAULT_PRIMARY_COLOR,
  managerInSchedule:           Boolean(data.manager_in_schedule),
  meetingsCountAsWork:         Boolean(data.meetings_count_as_work),
});

const icon = {
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
};

const SECTIONS = {
  legal: {
    title: 'Politique légale',
    icon: (
      <svg {...icon}>
        <path d="M12 3v18M7 21h10" />
        <path d="M5 7h14M5 7l-2.5 6a3 3 0 0 0 5 0L5 7zM19 7l-2.5 6a3 3 0 0 0 5 0L19 7z" />
      </svg>
    ),
  },
  brand: {
    title: 'Personnalisation',
    icon: (
      <svg {...icon}>
        <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z" />
        <circle cx="7.5" cy="11" r="1" /><circle cx="10.5" cy="7.5" r="1" /><circle cx="15" cy="7.5" r="1" />
      </svg>
    ),
  },
  templates: {
    title: 'Horaires types',
    icon: (
      <svg {...icon}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    ),
  },
  planning: {
    title: 'Planning',
    icon: (
      <svg {...icon}>
        <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
        <path d="M8 3v3M16 3v3M3.5 9.5h17" />
        <circle cx="12" cy="15" r="2.2" />
      </svg>
    ),
  },
  security: {
    title: 'Sécurité',
    icon: (
      <svg {...icon}>
        <rect x="5" y="10.5" width="14" height="10" rx="2" />
        <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      </svg>
    ),
  },
};

// Fenêtre d'une rubrique : se ferme avec Échap, la croix ou un clic à côté.
// Sur téléphone elle occupe tout l'écran (voir .settings-window dans le CSS).
function SettingsWindow({ id, wide = false, onClose, children }) {
  const ref = useRef(null);
  // onClose change à chaque rendu : on garde la dernière version sans
  // relancer l'effet (qui redonnerait le focus au premier champ).
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.querySelector('input, select, textarea, button:not(.settings-window-close)')?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onCloseRef.current(); };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  return (
    <div className="modal-overlay settings-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={ref}
        className={`modal settings-window${wide ? ' settings-window--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`settings-${id}-title`}
      >
        <div className="settings-window-head">
          <span className="settings-window-icon">{SECTIONS[id].icon}</span>
          <h3 id={`settings-${id}-title`}>{SECTIONS[id].title}</h3>
          <button type="button" className="settings-window-close" onClick={onClose} aria-label="Fermer">
            <svg {...icon} width="18" height="18"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Settings() {
  const { token } = useAuth();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // Rubrique dont la fenêtre est ouverte : 'legal', 'brand', 'templates', 'security' ou null
  const [openSection, setOpenSection] = useState(null);
  // Derniers paramètres enregistrés : rétablis si on ferme une fenêtre sans enregistrer
  const savedRef = useRef(null);

  const [pwForm, setPwForm] = useState(EMPTY_PASSWORD_FORM);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  const [templates,     setTemplates]     = useState([]);
  const [templateForm,  setTemplateForm]  = useState(EMPTY_TEMPLATE_FORM);
  const [editingTplId,  setEditingTplId]  = useState(null);
  const [tplSaving,     setTplSaving]     = useState(false);
  const [tplError,      setTplError]      = useState('');

  useEffect(() => {
    getSettings(token).then((data) => {
      savedRef.current = toForm(data);
      setForm(toForm(data));
    }).catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const loadTemplates = () => getShiftTemplates(token).then(setTemplates).catch((err) => setTplError(err.message));

  useEffect(() => { loadTemplates(); }, [token]);

  // Aperçu en direct de la couleur principale : appliquée au site pendant le
  // choix, mais annulée en quittant la page si elle n'a pas été enregistrée.
  const previewColor = form?.primaryColor;
  useEffect(() => {
    if (!HEX_COLOR.test(previewColor ?? '')) return;
    document.documentElement.style.setProperty('--primary', previewColor);
  }, [previewColor]);

  useEffect(() => () => {
    document.documentElement.style.setProperty('--primary', savedRef.current?.primaryColor ?? DEFAULT_PRIMARY_COLOR);
  }, []);

  const openWindow = (id) => { setNotice(''); setError(''); setOpenSection(id); };

  // Fermer sans enregistrer : on revient aux valeurs enregistrées
  const closeWindow = () => {
    if (savedRef.current) setForm(savedRef.current);
    setOpenSection(null);
    setError('');
    setPwError('');
    setPwForm(EMPTY_PASSWORD_FORM);
    setEditingTplId(null);
    setTplError('');
  };

  const openNewTemplate = () => { setTemplateForm(EMPTY_TEMPLATE_FORM); setEditingTplId('new'); setTplError(''); };

  const openEditTemplate = (t) => {
    setTemplateForm({
      name: t.name,
      startTime: formatTime(t.start_time),
      endTime: formatTime(t.end_time),
      breakStart: formatTime(t.break_start),
      breakEnd: formatTime(t.break_end),
      color: t.color ?? '',
    });
    setEditingTplId(t.id);
    setTplError('');
  };

  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    setTplSaving(true);
    setTplError('');
    try {
      const payload = {
        name: templateForm.name,
        startTime: templateForm.startTime,
        endTime: templateForm.endTime,
        breakStart: templateForm.breakStart || null,
        breakEnd: templateForm.breakEnd || null,
        color: templateForm.color || null,
      };
      if (editingTplId === 'new') await createShiftTemplate(payload, token);
      else await updateShiftTemplate(editingTplId, payload, token);
      setEditingTplId(null);
      await loadTemplates();
    } catch (err) {
      setTplError(err.message);
    } finally {
      setTplSaving(false);
    }
  };

  const handleTemplateDelete = async (id) => {
    if (!confirm('Supprimer ce modèle ?')) return;
    try {
      await deleteShiftTemplate(id, token);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setTplError(err.message);
    }
  };

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const handleColorPreview = (value) => handleChange('primaryColor', value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateSettings(form, token);
      savedRef.current = form;
      setOpenSection(null);
      setNotice('Paramètres enregistrés.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError('');

    if (pwForm.newPassword.length < 8) {
      setPwError('Le nouveau mot de passe doit faire au moins 8 caractères.');
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }

    setPwSaving(true);
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }, token);
      setPwForm(EMPTY_PASSWORD_FORM);
      setOpenSection(null);
      setNotice('Mot de passe modifié avec succès.');
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) return <div className="page-loading">Chargement…</div>;
  if (!form) return <div className="page"><PageHeader title="Paramètres" /><p className="error-msg">{error}</p></div>;

  const saved = savedRef.current;

  // Aperçu affiché sur chaque tuile
  const summaries = {
    legal: (
      <>
        {frNumber(saved.defaultWeeklyHours)} h par semaine · {frNumber(saved.leaveAccrualPerMonth)} j de congés par mois
        <br />
        Heures sup : {ratePercent(saved.overtimeTier1Rate)}, puis {ratePercent(saved.overtimeTier2Rate)} au-delà de {frNumber(saved.overtimeTier2ThresholdHours)} h
      </>
    ),
    brand: (
      <span className="settings-tile-inline">
        <span className="tpl-swatch" style={{ background: saved.primaryColor }} aria-hidden="true" />
        Couleur principale {saved.primaryColor.toUpperCase()}
      </span>
    ),
    templates: templates.length === 0 ? 'Aucun horaire type pour l\'instant' : (
      <span className="settings-tile-chips">
        {templates.map((t) => (
          <span key={t.id} className="settings-tile-inline">
            <span className="tpl-swatch" style={{ background: t.color || NEUTRAL_SHIFT_COLOR }} aria-hidden="true" />
            {t.name}
          </span>
        ))}
      </span>
    ),
    planning: (
      <>
        {saved.managerInSchedule ? 'Le gérant figure dans le planning' : 'Le gérant n\'est pas dans le planning'}
        <br />
        {saved.meetingsCountAsWork ? 'Réunions comptées dans les heures' : 'Réunions non comptées dans les heures'}
      </>
    ),
    security: 'Mot de passe de connexion',
  };

  const legalWarning = (field) => {
    const value = form[field];
    if (value === '' || Number(value) === LEGAL_DEFAULTS[field]) return null;
    return (
      <span className="settings-warning">
        Différent de la règle par défaut : ne modifiez que si votre convention collective
        ou un accord d'entreprise le prévoit.
      </span>
    );
  };

  const formFeedback = (
    <>
      {error && <p className="error-msg">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={closeWindow} disabled={saving}>Annuler</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </>
  );

  return (
    <div className="page">
      <PageHeader title="Paramètres" />

      {notice && <p className="settings-notice" role="status">{notice}</p>}

      <div className="settings-grid">
        {Object.entries(SECTIONS).map(([id, s]) => (
          <button key={id} type="button" className="settings-tile" onClick={() => openWindow(id)}>
            <span className="settings-tile-icon">{s.icon}</span>
            <span className="settings-tile-body">
              <span className="settings-tile-title">{s.title}</span>
              <span className="settings-tile-summary">{summaries[id]}</span>
            </span>
            <svg {...icon} className="settings-tile-chevron" width="18" height="18"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        ))}
      </div>

      {openSection === 'legal' && (
        <SettingsWindow id="legal" onClose={closeWindow}>
          <form onSubmit={handleSubmit}>
            <div className="field-row">
              <div className="field">
                <label>Durée hebdomadaire par défaut (h)</label>
                <input
                  type="number" step="0.5" min="1" max="48"
                  value={form.defaultWeeklyHours}
                  onChange={(e) => handleChange('defaultWeeklyHours', e.target.value)}
                />
                <span className="hint">Appliquée aux nouveaux employés (35h ou 39h en général).</span>
              </div>
              <div className="field">
                <label>Acquisition congés payés (jours / mois)</label>
                <input
                  type="number" step="0.01" min={LEGAL_DEFAULTS.leaveAccrualPerMonth} max="5"
                  value={form.leaveAccrualPerMonth}
                  onChange={(e) => handleChange('leaveAccrualPerMonth', e.target.value)}
                />
                <span className="hint">
                  2,08 j/mois = 25 jours ouvrés par an (5 semaines), minimum légal. Orgaly
                  compte les congés en jours ouvrés, du lundi au vendredi.
                </span>
                {legalWarning('leaveAccrualPerMonth')}
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Majoration heures sup — palier 1</label>
                <input
                  type="number" step="0.05" min="1.1" max="3"
                  value={form.overtimeTier1Rate}
                  onChange={(e) => handleChange('overtimeTier1Rate', e.target.value)}
                />
                <span className="hint">1,25 = +25 % (règle par défaut). Minimum légal : 1,10.</span>
                {legalWarning('overtimeTier1Rate')}
              </div>
              <div className="field">
                <label>Majoration heures sup — palier 2</label>
                <input
                  type="number" step="0.05" min="1.1" max="3"
                  value={form.overtimeTier2Rate}
                  onChange={(e) => handleChange('overtimeTier2Rate', e.target.value)}
                />
                <span className="hint">1,50 = +50 % (règle par défaut). Minimum légal : 1,10.</span>
                {legalWarning('overtimeTier2Rate')}
              </div>
            </div>
            <div className="field">
              <label>Seuil hebdo du palier 2 (h)</label>
              <input
                type="number" step="0.5" min="35" max="48"
                value={form.overtimeTier2ThresholdHours}
                onChange={(e) => handleChange('overtimeTier2ThresholdHours', e.target.value)}
              />
              <span className="hint">Au-delà de ce seuil hebdo, la majoration passe au palier 2 (43 h par défaut).</span>
              {legalWarning('overtimeTier2ThresholdHours')}
            </div>
            {formFeedback}
          </form>
        </SettingsWindow>
      )}

      {openSection === 'brand' && (
        <SettingsWindow id="brand" onClose={closeWindow}>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Couleur principale</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => handleColorPreview(e.target.value)}
                  style={{ width: 44, height: 34, padding: 2, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={form.primaryColor}
                  onChange={(e) => handleColorPreview(e.target.value)}
                  style={{ width: 100 }}
                />
                {form.primaryColor?.toUpperCase() !== DEFAULT_PRIMARY_COLOR && (
                  <button type="button" className="btn-ghost btn-sm" onClick={() => handleColorPreview(DEFAULT_PRIMARY_COLOR)}>
                    Couleur d'origine
                  </button>
                )}
              </div>
              <span className="hint">
                Utilisée pour les boutons, le menu et les accents du site. Le site l'affiche
                tout de suite ; « Annuler » revient à la couleur enregistrée.
              </span>
            </div>
            {formFeedback}
          </form>
        </SettingsWindow>
      )}

      {openSection === 'templates' && (
        <SettingsWindow id="templates" wide onClose={closeWindow}>
          <div className="tab-toolbar">
            <p className="hint" style={{ margin: 0 }}>
              Modèles réutilisables (ex : "Matin", 9h–17h) à glisser directement sur le planning
              pour créer un créneau sans ressaisir les horaires.
            </p>
            {!editingTplId && (
              <button type="button" className="btn-ghost btn-sm" onClick={openNewTemplate}>+ Ajouter</button>
            )}
          </div>

          {templates.length === 0 ? (
            <p className="empty-state">Aucun horaire type pour l'instant.</p>
          ) : (
            <div className="table-wrap" style={{ marginBottom: editingTplId ? 14 : 0 }}>
              <table className="rh-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Horaires</th>
                    <th>Pause</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className="tpl-name">
                          <span className="tpl-swatch" style={{ background: t.color || NEUTRAL_SHIFT_COLOR }} aria-hidden="true" />
                          <strong>{t.name}</strong>
                        </span>
                      </td>
                      <td>{formatTime(t.start_time)} → {formatTime(t.end_time)}</td>
                      <td className="text-muted">
                        {t.break_start ? `${formatTime(t.break_start)}–${formatTime(t.break_end)}` : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className="btn-ghost btn-sm" onClick={() => openEditTemplate(t)}>Modifier</button>
                          <button
                            type="button"
                            className="btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => handleTemplateDelete(t.id)}
                          >Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {editingTplId && (
            <form onSubmit={handleTemplateSubmit} className="inline-form">
              <div className="field-row">
                <div className="field">
                  <label>Nom *</label>
                  <input
                    type="text" required placeholder="Ex : Matin"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label>Début *</label>
                  <input
                    type="time" required
                    value={templateForm.startTime}
                    onChange={(e) => setTemplateForm((f) => ({ ...f, startTime: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label>Fin *</label>
                  <input
                    type="time" required
                    value={templateForm.endTime}
                    onChange={(e) => setTemplateForm((f) => ({ ...f, endTime: e.target.value }))}
                  />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Pause — début <span className="hint">(optionnel)</span></label>
                  <input
                    type="time"
                    value={templateForm.breakStart}
                    onChange={(e) => setTemplateForm((f) => ({ ...f, breakStart: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label>Pause — fin <span className="hint">(optionnel)</span></label>
                  <input
                    type="time"
                    value={templateForm.breakEnd}
                    onChange={(e) => setTemplateForm((f) => ({ ...f, breakEnd: e.target.value }))}
                  />
                </div>
              </div>
              <fieldset className="field color-field">
                <legend>Couleur dans le planning</legend>
                <div className="color-swatches">
                  {SHIFT_PALETTE.map((c) => (
                    <label key={c.value} className="color-swatch" title={c.label}>
                      <input
                        type="radio" name="tpl-color" value={c.value}
                        checked={templateForm.color === c.value}
                        onChange={() => setTemplateForm((f) => ({ ...f, color: c.value }))}
                      />
                      <span style={{ background: c.value }} />
                      <span className="sr-only">{c.label}</span>
                    </label>
                  ))}
                </div>
                {editingTplId === 'new' && !templateForm.color && (
                  <span className="hint">Sans choix, une couleur pas encore utilisée est attribuée.</span>
                )}
              </fieldset>
              {tplError && <p className="error-msg">{tplError}</p>}
              <div className="form-actions">
                <button type="button" className="btn-ghost" onClick={() => setEditingTplId(null)} disabled={tplSaving}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={tplSaving}>
                  {tplSaving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          )}
          {!editingTplId && tplError && <p className="error-msg">{tplError}</p>}
        </SettingsWindow>
      )}

      {openSection === 'planning' && (
        <SettingsWindow id="planning" onClose={closeWindow}>
          <form onSubmit={handleSubmit}>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={form.managerInSchedule}
                onChange={(e) => handleChange('managerInSchedule', e.target.checked)}
              />
              <span className="settings-switch-text">
                <strong>Le gérant apparaît dans le planning</strong>
                <span className="hint">
                  Pour les toutes petites équipes où le gérant travaille aussi en boutique : vous
                  avez votre propre ligne dans le planning, avec vos créneaux et vos réunions.
                  Décochez quand l'équipe est assez grande : vos créneaux passés restent enregistrés.
                  Vous n'êtes jamais compté dans l'équipe, la paie ni l'abonnement.
                </span>
              </span>
            </label>

            <label className="settings-switch">
              <input
                type="checkbox"
                checked={form.meetingsCountAsWork}
                onChange={(e) => handleChange('meetingsCountAsWork', e.target.checked)}
              />
              <span className="settings-switch-text">
                <strong>Compter les réunions dans les heures de travail</strong>
                <span className="hint">
                  Le temps de réunion en dehors du créneau (un jour de repos, avant ou après les
                  horaires, pendant une pause) s'ajoute aux heures de la semaine et à la paie
                  indicative. Une réunion pendant le créneau est déjà comptée : elle ne s'ajoute pas
                  une deuxième fois.
                </span>
              </span>
            </label>
            {formFeedback}
          </form>
        </SettingsWindow>
      )}

      {openSection === 'security' && (
        <SettingsWindow id="security" onClose={closeWindow}>
          <form onSubmit={handlePasswordSubmit}>
            <div className="field">
              <label>Mot de passe actuel</label>
              <input
                type="password" autoComplete="current-password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label>Nouveau mot de passe</label>
              <input
                type="password" autoComplete="new-password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                required
              />
              <span className="hint">8 caractères minimum.</span>
            </div>
            <div className="field">
              <label>Confirmer le nouveau mot de passe</label>
              <input
                type="password" autoComplete="new-password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                required
              />
            </div>

            {pwError && <p className="error-msg">{pwError}</p>}

            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={closeWindow} disabled={pwSaving}>Annuler</button>
              <button type="submit" className="btn-primary" disabled={pwSaving}>
                {pwSaving ? 'Enregistrement…' : 'Changer le mot de passe'}
              </button>
            </div>
          </form>
        </SettingsWindow>
      )}
    </div>
  );
}
