// Icônes de navigation — traits fins, cohérentes avec le style épuré du site.
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const DashboardIcon = () => (
  <svg {...base}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

export const EmployeesIcon = () => (
  <svg {...base}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
    <circle cx="17.5" cy="8.5" r="2.4" />
    <path d="M15.7 14.7c2.7.3 4.6 2.2 4.8 5" />
  </svg>
);

export const LeavesIcon = () => (
  <svg {...base}>
    <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
    <path d="M8 3v3M16 3v3M3.5 9.5h17" />
    <path d="M8.5 13.5l2 2 4-4" />
  </svg>
);

export const ScheduleIcon = () => (
  <svg {...base}>
    <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
    <path d="M8 3v3M16 3v3M3.5 9.5h17" />
    <path d="M8 14h2M13 14h3M8 17.5h7" />
  </svg>
);

export const PayrollIcon = () => (
  <svg {...base}>
    <path d="M6 8c0-2.2 2.7-4 6-4s6 1.8 6 4-2.7 4-6 4-6-1.8-6-4Z" />
    <path d="M6 8v8c0 2.2 2.7 4 6 4s6-1.8 6-4V8" />
    <path d="M6 12c0 2.2 2.7 4 6 4s6-1.8 6-4" />
  </svg>
);

export const TimesheetIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const SettingsIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18 6l-1.5 1.5M7.5 16.5 6 18M18 18l-1.5-1.5M7.5 7.5 6 6" />
  </svg>
);
