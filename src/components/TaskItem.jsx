function TaskItem({ task, onEdit, onDelete, onToggleStatus }) {
  const isCompleted = task.status === 'Completed'

  return (
    <article className={`task-card${isCompleted ? ' task-card-completed' : ''}`}>
      <div className="task-main">
        <button
          className={`task-check${isCompleted ? ' checked' : ''}`}
          type="button"
          aria-label={isCompleted ? 'Mark task as pending' : 'Mark task as completed'}
          aria-pressed={isCompleted}
          onClick={() => onToggleStatus(task)}
        >
          {isCompleted ? '✓' : ''}
        </button>
        <div className="task-copy">
          <h3>{task.title}</h3>
          {task.description ? <p>{task.description}</p> : null}
          <div className="task-meta">
            <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
              <span aria-hidden="true">●</span> {task.priority}
            </span>
            <span className={`status-badge status-${task.status.toLowerCase()}`}>
              {task.status}
            </span>
            <time dateTime={task.createdAt}>
              Added {new Date(task.createdAt).toLocaleDateString()}
            </time>
          </div>
        </div>
      </div>

      <div className="task-actions" aria-label={`Actions for ${task.title}`}>
        <button
          className="icon-button"
          type="button"
          aria-label={`Edit ${task.title}`}
          onClick={() => onEdit(task)}
        >
          Edit
        </button>
        <button
          className="icon-button icon-button-danger"
          type="button"
          aria-label={`Delete ${task.title}`}
          onClick={() => onDelete(task)}
        >
          Delete
        </button>
      </div>
    </article>
  )
}

export default TaskItem
