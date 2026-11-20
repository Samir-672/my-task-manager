import { useCallback, useEffect, useState } from 'react'
import ConfirmDialog from './ConfirmDialog.jsx'
import Header from './Header.jsx'
import SearchFilter from './SearchFilter.jsx'
import StatsCard from './StatsCard.jsx'
import TaskForm from './TaskForm.jsx'
import TaskList from './TaskList.jsx'
import * as taskApi from '../services/taskApi.js'

function Dashboard({ accessToken, userEmail, onSignOut, signOutError }) {
  // Dashboard owns the task data and passes it to smaller components through props.
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // useEffect calls this on the first render; the API keeps SQL work out of the UI.
  const loadTasks = useCallback(async () => {
    try {
      const taskData = await taskApi.getTasks(accessToken)
      setTasks(taskData)
      setError('')
      return true
    } catch (requestError) {
      setError(requestError.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    let isCurrent = true

    async function fetchInitialTasks() {
      try {
        const taskData = await taskApi.getTasks(accessToken)
        if (isCurrent) {
          setTasks(taskData)
        }
      } catch (requestError) {
        if (isCurrent) {
          setError(requestError.message)
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    fetchInitialTasks()
    return () => {
      isCurrent = false
    }
  }, [accessToken])

  // filter returns a new array; it does not mutate the source tasks in state.
  const visibleTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(search.trim().toLowerCase())
    const matchesStatus = statusFilter === 'All' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const pendingCount = tasks.filter((task) => task.status === 'Pending').length
  const completedCount = tasks.filter((task) => task.status === 'Completed').length
  const highPriorityCount = tasks.filter((task) => task.priority === 'High').length

  function openCreateForm() {
    setEditingTask(null)
    setIsFormOpen(true)
  }

  function openEditForm(task) {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  async function handleSaveTask(taskInput) {
    setIsSaving(true)
    setError('')
    setNotice('')

    try {
      const isEditing = Boolean(editingTask)
      if (isEditing) {
        await taskApi.updateTask(accessToken, editingTask.id, taskInput)
      } else {
        await taskApi.createTask(accessToken, taskInput)
      }

      const refreshed = await loadTasks()
      setIsFormOpen(false)
      setEditingTask(null)
      setNotice(
        refreshed
          ? isEditing
            ? 'Your task was updated.'
            : 'Your task was created.'
          : 'The task was saved, but the list could not be refreshed.',
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleStatus(task) {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed'
    setError('')
    setNotice('')

    try {
      await taskApi.updateTaskStatus(accessToken, task.id, nextStatus)
      const refreshed = await loadTasks()
      setNotice(
        refreshed
          ? nextStatus === 'Completed'
            ? 'Task marked as completed.'
            : 'Task moved back to pending.'
          : 'The status was saved, but the list could not be refreshed.',
      )
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function handleDeleteTask() {
    if (!taskToDelete) {
      return
    }

    setIsDeleting(true)
    setError('')
    setNotice('')
    try {
      await taskApi.deleteTask(accessToken, taskToDelete.id)
      const refreshed = await loadTasks()
      setTaskToDelete(null)
      setNotice(
        refreshed
          ? 'Your task was deleted.'
          : 'The task was deleted, but the list could not be refreshed.',
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const emptyMessage = error
    ? 'Tasks are unavailable'
    : tasks.length === 0
      ? 'No tasks yet'
      : 'No tasks match your search or filters'

  return (
    <div className="dashboard">
      <Header
        onAddTask={openCreateForm}
        onSignOut={onSignOut}
        userEmail={userEmail}
      />
      {signOutError ? (
        <div className="message message-error" role="alert">
          {signOutError}
        </div>
      ) : null}

      <section className="stats-grid" aria-label="Task statistics">
        <StatsCard label="Total tasks" value={tasks.length} icon="▤" tone="blue" />
        <StatsCard label="Pending" value={pendingCount} icon="◷" tone="amber" />
        <StatsCard label="Completed" value={completedCount} icon="✓" tone="green" />
        <StatsCard label="High priority" value={highPriorityCount} icon="↑" tone="rose" />
      </section>

      <section className="tasks-section">
        <div className="section-heading">
          <div>
            <h2>Your tasks</h2>
            <p>Keep track of what needs your attention.</p>
          </div>
          <span className="task-count">
            {visibleTasks.length} {visibleTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {error ? (
          <div className="message message-error" role="alert">
            <span>{error}</span>
            <button className="message-action" type="button" onClick={loadTasks}>
              Try again
            </button>
          </div>
        ) : null}

        {notice ? (
          <div className="message message-success" role="status">
            <span>{notice}</span>
            <button
              className="message-dismiss"
              type="button"
              aria-label="Dismiss message"
              onClick={() => setNotice('')}
            >
              ×
            </button>
          </div>
        ) : null}

        <SearchFilter
          search={search}
          status={statusFilter}
          priority={priorityFilter}
          onSearchChange={setSearch}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
        />

        <TaskList
          tasks={visibleTasks}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
          onEdit={openEditForm}
          onDelete={setTaskToDelete}
          onToggleStatus={handleToggleStatus}
        />
      </section>

      {isFormOpen ? (
        <TaskForm
          task={editingTask}
          isSaving={isSaving}
          error={error}
          onSave={handleSaveTask}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingTask(null)
          }}
        />
      ) : null}

      <ConfirmDialog
        task={taskToDelete}
        isDeleting={isDeleting}
        onConfirm={handleDeleteTask}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  )
}

export default Dashboard
