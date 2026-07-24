// Seuls les congés payés ont un vrai solde qui s'accumule (règle légale
// française basée sur la date d'embauche). Les autres types n'ont aucun
// mécanisme d'attribution de jours dans l'app, et pour la plupart (maladie,
// sans solde, maternité/paternité) le droit du travail français ne les gère
// de toute façon pas par "solde" — afficher un faux 0/0 serait trompeur.
// On montre alors simplement le nombre de jours posés cette année.
export default function LeaveBalanceCard({ leaveType, balanceDays, usedDays, hasBalance = true }) {
  if (!hasBalance) {
    return (
      <div className="balance-card balance-card--simple">
        <div className="balance-type">{leaveType}</div>
        <div className="balance-numbers">
          <span className="balance-available">{usedDays}</span>
          <span className="balance-total"> j pris</span>
        </div>
        <div className="balance-legend">
          <span>Cette année</span>
        </div>
      </div>
    );
  }

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
