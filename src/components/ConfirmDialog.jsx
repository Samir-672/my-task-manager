function ConfirmDialog({ task, isDeleting, onConfirm, onCancel }) {
  if (!task) {
    return null
  }

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <section
        className="confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="confirm-icon" aria-hidden="true">
          !
        </span>
        <h2 id="confirm-title">Delete this task?</h2>
        <p id="confirm-description">
          &ldquo;{task.title}&rdquo; will be permanently removed. This action cannot be
          undone.
        </p>
        <div className="modal-actions">
          <button className="button button-secondary" type="button" onClick={onCancel}>
            Keep task
          </button>
          <button
            className="button button-danger"
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete task'}
          </button>
        </div>
      </section>
    </div>
  )
}

export default ConfirmDialog
