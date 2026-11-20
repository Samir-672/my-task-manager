import TaskItem from './TaskItem.jsx'

function TaskList({
  tasks,
  isLoading,
  emptyMessage,
  onEdit,
  onDelete,
  onToggleStatus,
}) {
  if (isLoading) {
    return (
      <div className="empty-state" role="status">
        <span className="loading-spinner" aria-hidden="true" />
        <p>Loading your tasks...</p>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon" aria-hidden="true">
          ✓
        </span>
        <h3>{emptyMessage}</h3>
        <p>Your tasks will appear here when they are ready.</p>
      </div>
    )
  }

  return (
    <div className="task-list">
      {/* map creates one reusable TaskItem component for each matching task. */}
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  )
}

export default TaskList
