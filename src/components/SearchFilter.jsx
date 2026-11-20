function SearchFilter({
  search,
  status,
  priority,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
}) {
  return (
    <section className="task-toolbar" aria-label="Search and filter tasks">
      <label className="search-field">
        <span className="sr-only">Search tasks by title</span>
        <span className="search-icon" aria-hidden="true">
          ⌕
        </span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search tasks..."
        />
      </label>

      <label className="filter-field">
        <span className="sr-only">Filter by status</span>
        <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
          <option value="All">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
      </label>

      <label className="filter-field">
        <span className="sr-only">Filter by priority</span>
        <select
          value={priority}
          onChange={(event) => onPriorityChange(event.target.value)}
        >
          <option value="All">All priorities</option>
          <option value="High">High priority</option>
          <option value="Medium">Medium priority</option>
          <option value="Low">Low priority</option>
        </select>
      </label>
    </section>
  )
}

export default SearchFilter
