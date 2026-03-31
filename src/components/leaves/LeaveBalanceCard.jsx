export default function LeaveBalanceCard({ leaveType, balanceDays, usedDays }) {
  const available = Math.max(0, balanceDays - usedDays);
  const pct       = balanceDays > 0 ? Math.min(100, (usedDays / balanceDays) * 100) : 0;

  return (
    <div className="balance-card">
      <div className="balance-type">{leaveType}</div>
      <div className="balance-numbers">
        <span className="balance-available">{available}</span>
        <span className="balance-total"> / {balanceDays} j</span>
      </div>
      <div className="balance-bar">
        <div className="balance-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="balance-legend">
        <span>{usedDays} posé(s)</span>
        <span>{available} disponible(s)</span>
      </div>
    </div>
  );
}
