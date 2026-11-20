function StatsCard({ label, value, icon, tone }) {
  return (
    <article className={`stats-card stats-card-${tone}`}>
      <div className="stats-card-top">
        <span className="stats-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="stats-label">{label}</span>
      </div>
      <p className="stats-value">{value}</p>
    </article>
  )
}

export default StatsCard
