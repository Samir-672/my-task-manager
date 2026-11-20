import { withUserDatabase } from '../config/database.js'

const taskColumns = `
  id,
  title,
  description,
  status,
  priority,
  created_at,
  updated_at
`

class RequestError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
  }
}

function getTaskId(request) {
  const rawId = request.params.id
  if (!/^\d+$/.test(rawId) || rawId.length > 19) {
    throw new RequestError('Task ID must be a positive integer.', 400)
  }

  const id = BigInt(rawId)
  if (id < 1n || id > 9223372036854775807n) {
    throw new RequestError('Task ID must be a positive PostgreSQL bigint.', 400)
  }

  // Keep bigint IDs as strings so JavaScript does not lose integer precision.
  return id.toString()
}

function validateTaskInput(body = {}) {
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const description =
    body.description == null
      ? ''
      : typeof body.description === 'string'
        ? body.description.trim()
        : null
  const priority = body.priority ?? 'Medium'

  if (!title) {
    throw new RequestError('Task title is required.', 400)
  }
  if (title.length > 150) {
    throw new RequestError('Task title must be 150 characters or fewer.', 400)
  }
  if (description === null) {
    throw new RequestError('Task description must be text.', 400)
  }
  if (description.length > 500) {
    throw new RequestError('Task description must be 500 characters or fewer.', 400)
  }
  if (!['Low', 'Medium', 'High'].includes(priority)) {
    throw new RequestError('Priority must be Low, Medium, or High.', 400)
  }

  return { title, description, priority }
}

function formatTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getTasks(request, response) {
  const userId = request.authUser.id
  const result = await withUserDatabase(userId, (database) => database.query(`
    SELECT ${taskColumns}
    FROM public.tasks
    WHERE user_id = $1
    ORDER BY CASE WHEN status = 'Pending' THEN 0 ELSE 1 END, created_at DESC;
  `, [userId]))

  response.json(result.rows.map(formatTask))
}

export async function getTask(request, response) {
  const id = getTaskId(request)
  const userId = request.authUser.id
  const result = await withUserDatabase(userId, (database) =>
    database.query(
      `SELECT ${taskColumns} FROM public.tasks WHERE id = $1 AND user_id = $2;`,
      [id, userId],
    ),
  )

  if (result.rowCount === 0) {
    throw new RequestError('Task not found.', 404)
  }

  response.json(formatTask(result.rows[0]))
}

export async function createTask(request, response) {
  const task = validateTaskInput(request.body)
  const userId = request.authUser.id
  const result = await withUserDatabase(userId, (database) =>
    database.query(
      `
        INSERT INTO public.tasks (user_id, title, description, priority)
        VALUES ($1, $2, $3, $4)
        RETURNING ${taskColumns};
      `,
      [userId, task.title, task.description || null, task.priority],
    ),
  )

  response.status(201).json(formatTask(result.rows[0]))
}

export async function updateTask(request, response) {
  const id = getTaskId(request)
  const task = validateTaskInput(request.body)
  const userId = request.authUser.id
  const result = await withUserDatabase(userId, (database) =>
    database.query(
      `
        UPDATE public.tasks
        SET title = $1,
            description = $2,
            priority = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4 AND user_id = $5
        RETURNING ${taskColumns};
      `,
      [task.title, task.description || null, task.priority, id, userId],
    ),
  )

  if (result.rowCount === 0) {
    throw new RequestError('Task not found.', 404)
  }

  response.json(formatTask(result.rows[0]))
}

export async function updateTaskStatus(request, response) {
  const id = getTaskId(request)
  const userId = request.authUser.id
  const { status } = request.body ?? {}
  if (!['Pending', 'Completed'].includes(status)) {
    throw new RequestError('Status must be Pending or Completed.', 400)
  }

  const result = await withUserDatabase(userId, (database) =>
    database.query(
      `
        UPDATE public.tasks
        SET status = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
        RETURNING ${taskColumns};
      `,
      [status, id, userId],
    ),
  )

  if (result.rowCount === 0) {
    throw new RequestError('Task not found.', 404)
  }

  response.json(formatTask(result.rows[0]))
}

export async function deleteTask(request, response) {
  const id = getTaskId(request)
  const userId = request.authUser.id
  const result = await withUserDatabase(userId, (database) =>
    database.query(
      'DELETE FROM public.tasks WHERE id = $1 AND user_id = $2 RETURNING id;',
      [id, userId],
    ),
  )

  if (result.rowCount === 0) {
    throw new RequestError('Task not found.', 404)
  }

  response.status(204).end()
}
