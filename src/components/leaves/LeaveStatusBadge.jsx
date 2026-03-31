export default function LeaveStatusBadge({ status }) {
  const config = {
    en_attente: { label: 'En attente', className: 'badge-pending' },
    approuvé:   { label: 'Approuvé',   className: 'badge-active'  },
    refusé:     { label: 'Refusé',     className: 'badge-inactive'},
  };
  const { label, className } = config[status] ?? { label: status, className: '' };
  return <span className={`badge ${className}`}>{label}</span>;
}
