import { useState } from 'react'

function TaskForm({ task, isSaving, error, onSave, onCancel }) {
  // Initial values are copied into local state so each input is controlled by React.
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState(task?.priority ?? 'Medium')

  function handleSubmit(event) {
    event.preventDefault()
    onSave({ title: title.trim(), description: description.trim(), priority })
  }

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <section
        className="task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-form-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{task ? 'UPDATE YOUR TASK' : 'MAKE A PLAN'}</p>
            <h2 id="task-form-title">{task ? 'Edit task' : 'Add a task'}</h2>
          </div>
          <button
            className="modal-close"
            type="button"
            aria-label="Close form"
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        {error ? (
          <div className="message message-error" role="alert">
            {error}
          </div>
        ) : null}

        <form className="task-form" onSubmit={handleSubmit}>
          <label>
            Task title <span className="required-mark">*</span>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Prepare project presentation"
              maxLength={150}
              required
            />
          </label>

          <label>
            Description <span className="optional-label">Optional</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add a few details..."
              maxLength={500}
              rows={4}
            />
          </label>

          <label>
            Priority
            <select value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>

          <div className="modal-actions">
            <button className="button button-secondary" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button className="button button-primary" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default TaskForm
