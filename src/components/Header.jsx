function Header({ onAddTask, onSignOut, userEmail }) {
  // Keep the displayed date readable while exposing a machine-readable value to browsers.
  const today = new Date()

  return (
    <header className="dashboard-header">
      <div>
        <p className="eyebrow">PERSONAL WORKSPACE</p>
        <h1>My Task Manager</h1>
        <p className="welcome-copy">Welcome back. Let&apos;s make today count.</p>
      </div>
      <div className="header-actions">
        <div className="account-actions">
          <span className="account-email">{userEmail}</span>
          <button className="button button-secondary" type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
        <time className="current-date" dateTime={today.toISOString()}>
          {today.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </time>
        <button className="button button-primary" type="button" onClick={onAddTask}>
          <span aria-hidden="true">+</span> Add task
        </button>
      </div>
    </header>
  )
}

export default Header
