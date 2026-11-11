import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAdminSchedule, createShift, deleteShift } from '../api/schedule';
import { getMeetings } from '../api/meetings';
import { getPlanningPeople, updateEmployeeOrder } from '../api/employees';
import { getSettings } from '../api/settings';
import { getShiftTemplates } from '../api/shiftTemplates';
import WeekView, { getWeekDays, toISO } from '../components/schedule/WeekView';
import MonthView from '../components/schedule/MonthView';
import ShiftModal from '../components/schedule/ShiftModal';
import MeetingModal from '../components/schedule/MeetingModal';
import TemplatePalette from '../components/schedule/TemplatePalette';
import PhoneCalendar from '../components/schedule/PhoneCalendar';
import AssignTemplateModal from '../components/schedule/AssignTemplateModal';
import WeekTemplatesMenu from '../components/schedule/WeekTemplatesMenu';
import ApplyWeekTemplateModal from '../components/schedule/ApplyWeekTemplateModal';
import AiPlanningModal from '../components/schedule/AiPlanningModal';
import SaveWeekTemplateModal from '../components/schedule/SaveWeekTemplateModal';
import ClearWeekModal from '../components/schedule/ClearWeekModal';
import { getWeekTemplates, applyWeekTemplate } from '../api/weekTemplates';
import { countText } from '../components/schedule/weekTemplateUtils';
import { useNavigate } from 'react-router-dom';
import ScheduleTopbarButtons from '../components/schedule/ScheduleTopbarButtons';
import PhoneScheduleBar from '../components/schedule/PhoneScheduleBar';
import EmployeeMultiSelect from '../components/EmployeeMultiSelect';
import useMediaQuery, { PHONE_QUERY } from '../utils/useMediaQuery';
import PageHeader from '../components/PageHeader';
import { weekLabel } from '../utils/weekLabel';

const getMondayOfWeek = (date = new Date()) => {
  const d   = new Date(date);
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - dow);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Employés affichés : ceux choisis dans le menu, ou tout le monde
const displayedEmployeesFor = (employees, ids) => (ids.length > 0
  ? employees.filter(e => ids.includes(e.id))
  : employees);

const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export default function AdminSchedule() {
  const { token } = useAuth();

  const [view,        setView]        = useState('week');
  // Téléphone : Semaine (comme sur ordinateur, horaires types à glisser au
  // doigt) ou Mois (calendrier façon agenda) ; avant le 11 nov. 2026, le
  // gérant n'avait que le mois sur téléphone.
  const isPhone   = useMediaQuery(PHONE_QUERY);
  const shownView = view;
  const [monday,      setMonday]      = useState(getMondayOfWeek());
  const [monthDate,   setMonthDate]   = useState(new Date());
  const [employees,   setEmployees]   = useState([]);
  const [templates,   setTemplates]   = useState([]);
  const [shifts,      setShifts]      = useState([]);
  const [meetings,    setMeetings]    = useState([]);
  // Employés affichés (aucun choisi = tout le monde)
  const [filteredIds, setFilteredIds] = useState([]);
  // Téléphone : choix des employés caché derrière l'entonnoir de la barre du haut
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(null);
  const [meetingModal, setMeetingModal] = useState(null);
  // Réglage de l'entreprise : temps de réunion hors créneau compté comme travail
  const [countMeetings, setCountMeetings] = useState(false);
  // Jours d'ouverture de la boutique (jours fermés grisés)
  const [openDays, setOpenDays] = useState(null);
  // Lundi de Pentecôte travaillé (journée de solidarité) : pas affiché férié
  const [pentecostWorked, setPentecostWorked] = useState(false);
  // Semaines types (11 nov. 2026) : liste, fenêtre ouverte
  // ({ kind: 'apply', source: 'previous' | id } ou { kind: 'save' }), message
  const navigate = useNavigate();
  const [weekTemplates, setWeekTemplates] = useState([]);
  const [weekModal, setWeekModal] = useState(null);
  const [weekNotice, setWeekNotice] = useState('');
  // Après « Vider cette semaine » : ce qui a été effacé, pour « Annuler »
  const [weekUndo, setWeekUndo] = useState(null);
  // Planning généré par IA (11 nov. 2026) : fenêtre ouverte, message après application
  const [aiOpen, setAiOpen] = useState(false);
  const [aiNotice, setAiNotice] = useState('');
  // Bouton seulement pour les entreprises qui ont accès à l'IA (démo, SAS LLDB au départ)
  const [aiEnabled, setAiEnabled] = useState(false);

  useEffect(() => {
    getWeekTemplates(token).then(setWeekTemplates).catch(console.error);
  }, [token]);
  // Le message concerne la semaine affichée : il disparaît quand on en change
  useEffect(() => { setWeekNotice(''); setWeekUndo(null); }, [monday]);

  const undoClear = async () => {
    const undo = weekUndo;
    setWeekUndo(null);
    try {
      const r = await applyWeekTemplate({ weekStart: undo.weekStart, mode: 'empty', slots: undo.slots }, token);
      setWeekNotice(`Semaine remise comme avant (${r.added} case${r.added > 1 ? 's' : ''}).`);
      loadShifts();
    } catch (err) {
      setWeekNotice(`Impossible d'annuler : ${err.message}`);
    }
  };

  useEffect(() => {
    getPlanningPeople(token).then(setEmployees).catch(console.error);
    getSettings(token).then((s) => {
      setCountMeetings(Boolean(s.meetings_count_as_work));
      setOpenDays(s.open_days);
      setPentecostWorked(Boolean(s.pentecost_monday_worked));
      setAiEnabled(Boolean(s.ai_planning_enabled));
    }).catch(console.error);
    getShiftTemplates(token).then(setTemplates).catch(console.error);
  }, [token]);

  const getDateRange = useCallback(() => {
    if (shownView === 'week') {
      const days = getWeekDays(monday);
      return { start: toISO(days[0]), end: toISO(days[6]) };
    }
    const y = monthDate.getFullYear();
    const m = monthDate.getMonth();
    return {
      start: toISO(new Date(y, m, 1)),
      end:   toISO(new Date(y, m + 1, 0)),
    };
  }, [shownView, monday, monthDate]);

  // Tous les créneaux de la période : le filtre par employé se fait à
  // l'affichage, pour pouvoir en choisir plusieurs.
  const loadShifts = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const [data, meets] = await Promise.all([
        getAdminSchedule(start, end, null, token),
        getMeetings(start, end, token),
      ]);
      setShifts(data);
      setMeetings(meets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getDateRange, token]);

  useEffect(() => { loadShifts(); }, [loadShifts]);

  const prevWeek  = () => setMonday(d => { const n = new Date(d); n.setDate(n.getDate()-7); return n; });
  const nextWeek  = () => setMonday(d => { const n = new Date(d); n.setDate(n.getDate()+7); return n; });
  const prevMonth = () => setMonthDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1));
  const nextMonth = () => setMonthDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1));

  const handleDelete = async (shift) => {
    if (!confirm('Supprimer ce créneau ?')) return;
    try {
      await deleteShift(shift.id, token);
      setShifts(prev => prev.filter(s => s.id !== shift.id));
    } catch (err) {
      alert(err.message);
    }
  };

  // Un créneau enregistré remplace celui du même employé le même jour.
  // Le serveur ne renvoie pas le nom de l'employé : on le reprend de la
  // liste (sinon « undefined undefined » dans le détail du jour).
  const handleSaved = (raw) => {
    const emp = employees.find(e => e.id === raw.user_id);
    const saved = raw.first_name || !emp
      ? raw
      : { ...raw, first_name: emp.first_name, last_name: emp.last_name };
    setShifts(prev => [
      ...prev.filter(s => s.id !== saved.id
        && !(s.user_id === saved.user_id && s.date?.slice(0, 10) === saved.date?.slice(0, 10))),
      saved,
    ]);
  };

  const handleMeetingSaved = (saved) => {
    setMeetings(prev => [...prev.filter(m => m.id !== saved.id), saved]);
  };

  const handleMeetingDeleted = (id) => {
    setMeetings(prev => prev.filter(m => m.id !== id));
  };

  // Glisser-déposer une ligne employé pour la remonter/descendre dans le
  // planning : déplace l'id glissé juste à la position de l'id cible dans
  // la liste complète (indépendamment du filtre affiché), affiche aussitôt
  // le nouvel ordre, puis l'enregistre ; annule l'affichage si ça échoue.
  const handleReorder = async (draggedId, targetId) => {
    const from = employees.findIndex(e => e.id === draggedId);
    const to   = employees.findIndex(e => e.id === targetId);
    if (from === -1 || to === -1) return;

    const previous = employees;
    const next = [...employees];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setEmployees(next);

    try {
      await updateEmployeeOrder(next.map(e => e.id), token);
    } catch (err) {
      setEmployees(previous);
      alert(err.message);
    }
  };

  // Dépose d'un horaire type sur une case du planning : crée le créneau
  // directement avec les horaires du modèle, sans passer par la fenêtre de
  // création (choix du client — la rapidité prime sur la confirmation).
  const applyTemplate = async (userId, date, template) => {
    // "Repos" glissé : jour entier non travaillé (mêmes bornes qu'un congé)
    if (template.kind === 'repos') {
      handleSaved(await createShift(
        { userId, date, startTime: '00:00', endTime: '23:59', breaks: [], type: 'repos' },
        token
      ));
      return;
    }
    const breaks = template.break_start
      ? [{ start_time: template.break_start, end_time: template.break_end, label: 'Pause' }]
      : [];
    handleSaved(await createShift(
      { userId, date, startTime: template.start_time, endTime: template.end_time, breaks, type: 'travail' },
      token
    ));
  };

  const handleTemplateDrop = async (userId, date, template) => {
    try {
      await applyTemplate(userId, date, template);
    } catch (err) {
      alert(err.message);
    }
  };

  // Mois : horaire type lâché sur un jour (11 nov. 2026). Un seul salarié
  // affiché (menu des employés) et libre ce jour-là : appliqué directement ;
  // sinon, fenêtre « À quels salariés ? ».
  const [assign, setAssign] = useState(null);
  const assignPeople = displayedEmployeesFor(employees, filteredIds).filter(e => e.is_active !== false);
  const handleDayDrop = (date, template) => {
    const busy = (id) => shifts.some(s => s.user_id === id && s.date?.slice(0, 10) === date);
    if (filteredIds.length === 1 && assignPeople.length === 1 && !busy(assignPeople[0].id)) {
      handleTemplateDrop(assignPeople[0].id, date, template);
      return;
    }
    setAssign({ date, template });
  };
  // Un employé visé (semaine) : créneau direct ; seulement un jour (mois) : on demande
  const handleAnyDrop = (userId, date, template) => (userId
    ? handleTemplateDrop(userId, date, template)
    : handleDayDrop(date, template));
  // Fenêtre : un créneau par salarié coché ; renvoie ceux qui ont échoué
  const applyToMany = async (ids) => {
    const failed = [];
    for (const id of ids) {
      try {
        await applyTemplate(id, assign.date, assign.template);
      } catch (err) {
        const emp = employees.find(e => e.id === id);
        failed.push({ id, message: `${emp ? `${emp.first_name} ${emp.last_name}` : 'Un salarié'} : ${err.message}` });
      }
    }
    return failed;
  };

  const weekDays = getWeekDays(monday);
  const range = getDateRange();

  const displayedEmployees = displayedEmployeesFor(employees, filteredIds);

  // Date proposée pour une nouvelle réunion : aujourd'hui s'il est affiché
  const defaultMeetingDate = () => {
    const today = toISO(new Date());
    return today >= range.start && today <= range.end ? today : range.start;
  };

  return (
    <div className="page page--wide">
      <PageHeader
        title="Planning"
        actions={isPhone ? null : (
          <>
            {aiEnabled && (
              <button className="btn-secondary" onClick={() => { setAiNotice(''); setAiOpen(true); }}>
                <span className="ai-spark" aria-hidden="true">✦</span> Générer avec l'IA
              </button>
            )}
            <button className="btn-secondary" onClick={() => setMeetingModal({ date: defaultMeetingDate() })}>+ Réunion</button>
            <button className="btn-primary" onClick={() => setModal({})}>+ Nouveau créneau</button>
          </>
        )}
        topbarActions={isPhone ? (
          <ScheduleTopbarButtons
            filterOpen={filterOpen}
            filterActive={filteredIds.length > 0}
            onToggleFilter={() => setFilterOpen((o) => !o)}
            onNewShift={() => setModal({})}
            onNewMeeting={() => setMeetingModal({ date: defaultMeetingDate() })}
          />
        ) : null}
      />

      {isPhone ? (
        // Téléphone (proposition « B », 11 nov. 2026) : une seule ligne
        // ‹ période › + Semaine/Mois, « Aujourd'hui » en petit sous la date ;
        // le choix des employés n'apparaît qu'après l'entonnoir.
        <>
          {filterOpen && (
            <div className="schedule-filter schedule-filter--phone">
              <EmployeeMultiSelect
                employees={employees}
                value={filteredIds}
                onChange={setFilteredIds}
                allLabel="Tous les employés"
                emptyMeansAll
              />
            </div>
          )}
          <PhoneScheduleBar
            label={shownView === 'week'
              ? weekLabel(weekDays[0], weekDays[6])
              : `${MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear()}`}
            onPrev={shownView === 'week' ? prevWeek : prevMonth}
            onNext={shownView === 'week' ? nextWeek : nextMonth}
            onToday={() => { setMonday(getMondayOfWeek()); setMonthDate(new Date()); }}
            view={view}
            onView={setView}
          />
        </>
      ) : (
      <div className="schedule-toolbar">
        <div className="schedule-filter">
          <EmployeeMultiSelect
            employees={employees}
            value={filteredIds}
            onChange={setFilteredIds}
            allLabel="Tous les employés"
            emptyMeansAll
          />
        </div>

        <div className="schedule-nav">
          <button className="btn-ghost" onClick={shownView === 'week' ? prevWeek : prevMonth}>←</button>
          <span className="schedule-period">
            {shownView === 'week'
              ? weekLabel(weekDays[0], weekDays[6])
              : `${MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear()}`
            }
          </span>
          <button className="btn-ghost" onClick={shownView === 'week' ? nextWeek : nextMonth}>→</button>
          <button className="btn-ghost" onClick={() => { setMonday(getMondayOfWeek()); setMonthDate(new Date()); }}>
            Aujourd'hui
          </button>
        </div>

        <div className="role-toggle">
          <button className={`role-btn ${view==='week'?'active':''}`} onClick={() => setView('week')}>Semaine</button>
          <button className={`role-btn ${view==='month'?'active':''}`} onClick={() => setView('month')}>Mois</button>
        </div>
      </div>
      )}

      {/* En semaine, les horaires types à glisser (déjà en couleur) servent
          de légende, sur téléphone comme sur ordinateur (11 nov. 2026) */}
      {/* Mois : horaires types en version fine, sous la barre d'outils comme
          en semaine (avant, dans la barre : Semaine/Mois passait à la ligne,
          demande de Cédric de les remettre comme en semaine) */}
      {shownView !== 'week' && <TemplatePalette templates={templates} onTouchDrop={handleAnyDrop} compact />}
      {shownView === 'week' && (
        <TemplatePalette templates={templates} onTouchDrop={handleAnyDrop}>
          <WeekTemplatesMenu
            weekTemplates={weekTemplates}
            onApply={(t) => { setWeekNotice(''); setWeekModal({ kind: 'apply', source: t.id }); }}
            onCopyPrevious={() => { setWeekNotice(''); setWeekModal({ kind: 'apply', source: 'previous' }); }}
            onSave={() => { setWeekNotice(''); setWeekModal({ kind: 'save' }); }}
            onManage={() => navigate('/parametres?rubrique=weeks')}
            onClear={() => { setWeekNotice(''); setWeekUndo(null); setWeekModal({ kind: 'clear' }); }}
          />
        </TemplatePalette>
      )}
      {weekNotice && shownView === 'week' && (
        <p className="settings-notice wt-notice" role="status">
          {weekNotice}
          {weekUndo && <button type="button" className="wt-undo" onClick={undoClear}>Annuler</button>}
        </p>
      )}
      {aiNotice && <p className="settings-notice wt-notice" role="status">{aiNotice}</p>}

      {loading ? (
        <p className="tab-loading">Chargement…</p>
      ) : view === 'month' && isPhone ? (
        <PhoneCalendar openDays={openDays} pentecostWorked={pentecostWorked}
          key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
          year={monthDate.getFullYear()}
          month={monthDate.getMonth()}
          shifts={shifts}
          meetings={meetings}
          isAdmin
          selectedUserIds={filteredIds}
          onShiftClick={(shift) => setModal({ shift })}
          onShiftDelete={handleDelete}
          onAddShift={(date) => setModal({ date })}
          onMeetingClick={(meeting) => setMeetingModal({ meeting })}
          onTemplateDropDay={handleDayDrop}
        />
      ) : view === 'week' ? (
        <WeekView openDays={openDays} pentecostWorked={pentecostWorked}
          days={weekDays}
          shifts={shifts}
          meetings={meetings}
          countMeetings={countMeetings}
          employees={displayedEmployees}
          isAdmin={true}
          onShiftClick={(shift) => setModal({ shift })}
          onShiftDelete={handleDelete}
          onTemplateDrop={handleTemplateDrop}
          onMeetingClick={(meeting) => setMeetingModal({ meeting })}
          onReorder={handleReorder}
          phone={isPhone}
        />
      ) : (
        <MonthView openDays={openDays} pentecostWorked={pentecostWorked}
          key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}
          year={monthDate.getFullYear()}
          month={monthDate.getMonth()}
          shifts={shifts}
          meetings={meetings}
          isAdmin={true}
          selectedUserIds={filteredIds}
          onShiftClick={(shift) => setModal({ shift })}
          onShiftDelete={handleDelete}
          onAddShift={(date) => setModal({ date })}
          onMeetingClick={(meeting) => setMeetingModal({ meeting })}
          onTemplateDropDay={handleDayDrop}
        />
      )}

      {aiOpen && (
        <AiPlanningModal
          // Mois affiché, ou celui du jeudi de la semaine affichée
          initialMonth={(() => {
            const d = view === 'month' ? monthDate : new Date(weekDays[3]);
            return { year: d.getFullYear(), month: d.getMonth() + 1 };
          })()}
          employees={employees}
          shiftTemplates={templates}
          onClose={() => setAiOpen(false)}
          onDone={(r, label, period) => {
            setAiOpen(false);
            const done = r.added + r.replaced;
            setAiNotice(`Planning de ${label} : ${done} case${done > 1 ? 's' : ''} enregistrée${done > 1 ? 's' : ''}`
              + (r.replaced ? ` (dont ${r.replaced} remplacée${r.replaced > 1 ? 's' : ''})` : '') + '.');
            setView('month');
            setMonthDate(new Date(period.year, period.month - 1, 1));
            loadShifts();
          }}
        />
      )}

      {weekModal?.kind === 'apply' && (
        <ApplyWeekTemplateModal
          weekStart={toISO(weekDays[0])}
          initialSource={weekModal.source}
          weekTemplates={weekTemplates}
          shiftTemplates={templates}
          employees={employees}
          shifts={shifts}
          onClose={() => setWeekModal(null)}
          onDone={(r, sourceName) => {
            setWeekModal(null);
            const done = r.added + r.replaced;
            setWeekNotice(`${sourceName} : ${done} case${done > 1 ? 's' : ''} remplie${done > 1 ? 's' : ''}`
              + (r.replaced ? ` (dont ${r.replaced} remplacée${r.replaced > 1 ? 's' : ''})` : '')
              + (r.kept ? `, ${r.kept} déjà remplie${r.kept > 1 ? 's' : ''} gardée${r.kept > 1 ? 's' : ''}` : '')
              + (r.protected ? `, ${r.protected} congé${r.protected > 1 ? 's' : ''} ou absence${r.protected > 1 ? 's' : ''} gardé${r.protected > 1 ? 's' : ''}` : '')
              + '.');
            loadShifts();
          }}
        />
      )}

      {weekModal?.kind === 'clear' && (
        <ClearWeekModal
          weekStart={toISO(weekDays[0])}
          employees={displayedEmployees}
          allCount={employees.length}
          shifts={shifts}
          onClose={() => setWeekModal(null)}
          onDone={(r) => {
            setWeekModal(null);
            setWeekNotice(`Semaine vidée : ${r.deleted} case${r.deleted > 1 ? 's' : ''} effacée${r.deleted > 1 ? 's' : ''}.`);
            setWeekUndo(r.slots.length ? { weekStart: toISO(weekDays[0]), slots: r.slots } : null);
            loadShifts();
          }}
        />
      )}

      {weekModal?.kind === 'save' && (
        <SaveWeekTemplateModal
          weekStart={toISO(weekDays[0])}
          weekTemplates={weekTemplates}
          employees={employees}
          shifts={shifts}
          onClose={() => setWeekModal(null)}
          onSaved={(saved, replaced) => {
            setWeekModal(null);
            setWeekTemplates((prev) => [...prev.filter((t) => t.id !== saved.id), saved]
              .sort((a, b) => a.name.localeCompare(b.name, 'fr')));
            const n = saved.slots.filter((s) => s.type === 'travail').length;
            const r = saved.slots.length - n;
            setWeekNotice(`Semaine type « ${saved.name} » ${replaced ? 'remplacée' : 'enregistrée'} (${countText(n, r)}).`);
          }}
        />
      )}

      {assign && (
        <AssignTemplateModal
          date={assign.date}
          template={assign.template}
          employees={assignPeople}
          shifts={shifts}
          onApply={applyToMany}
          onClose={() => setAssign(null)}
        />
      )}

      {modal !== null && (
        <ShiftModal
          shift={modal.shift}
          date={modal.date}
          userId={modal.userId}
          employees={employees}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      {meetingModal !== null && (
        <MeetingModal
          meeting={meetingModal.meeting}
          date={meetingModal.date}
          employees={employees.filter(e => e.is_active)}
          shifts={shifts}
          range={range}
          countMeetings={countMeetings}
          onClose={() => setMeetingModal(null)}
          onSaved={handleMeetingSaved}
          onDeleted={handleMeetingDeleted}
        />
      )}
    </div>
  );
}
