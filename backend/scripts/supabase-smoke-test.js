import 'dotenv/config'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { getDatabase } from '../config/database.js'

const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5000/api'
const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '')
const anonKey = process.env.SUPABASE_ANON_KEY?.trim()
let database
let accessToken
let temporaryTaskId
let temporaryTaskTitles = []
const temporaryTaskDescription =
  'This temporary row is removed by the integration test.'
const updatedTaskDescription =
  'Temporary record updated by the integration test.'
let currentStep = 'test configuration'

function pass(message) {
  console.log(`PASS ${message}`)
}

async function request(path, options = {}, token) {
  const headers = { ...options.headers }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  })
  const text = await response.text()
  return {
    response,
    body: text ? JSON.parse(text) : null,
  }
}

function expectStatus(response, expectedStatus, label) {
  assert.equal(response.status, expectedStatus, `${label} returned HTTP ${response.status}`)
}

async function signInTestUser() {
  const email = process.env.SUPABASE_TEST_EMAIL?.trim()
  const password = process.env.SUPABASE_TEST_PASSWORD
  assert.ok(supabaseUrl, 'SUPABASE_URL is not configured.')
  assert.ok(anonKey, 'SUPABASE_ANON_KEY is not configured.')
  assert.ok(email && password, 'A Supabase Auth integration-test account is not configured.')

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(10_000),
  })
  const body = await response.json()
  expectStatus(response, 200, 'Supabase Auth test sign-in')
  assert.ok(typeof body.access_token === 'string' && body.access_token.length > 0)
  assert.match(
    body.user?.id || '',
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  )
  accessToken = body.access_token
  pass('Supabase Auth issued a valid test-user session (token redacted)')
}

async function verifyOtherUserCannotRead(taskId) {
  const otherUserId = randomUUID()
  const client = await database.connect()

  try {
    await client.query('BEGIN')
    await client.query('SET LOCAL ROLE authenticated')
    await client.query(
      `
        SELECT
          set_config('request.jwt.claims', $1, true),
          set_config('request.jwt.claim.sub', $2, true);
      `,
      [JSON.stringify({ sub: otherUserId, role: 'authenticated' }), otherUserId],
    )
    const identity = await client.query('SELECT auth.uid() AS user_id;')
    assert.equal(identity.rows[0].user_id, otherUserId)
    const result = await client.query(
      'SELECT id FROM public.tasks WHERE id = $1;',
      [taskId],
    )
    assert.equal(result.rowCount, 0)
    const update = await client.query(
      'UPDATE public.tasks SET title = $1 WHERE id = $2 RETURNING id;',
      ['Unauthorized update attempt', taskId],
    )
    assert.equal(update.rowCount, 0)
    const deletion = await client.query(
      'DELETE FROM public.tasks WHERE id = $1 RETURNING id;',
      [taskId],
    )
    assert.equal(deletion.rowCount, 0)
  } finally {
    await client.query('ROLLBACK')
    client.release()
  }
}

async function runIntegrationTest() {
  const connectionString = process.env.DATABASE_URL?.trim()
  assert.ok(connectionString, 'DATABASE_URL is not loaded.')
  assert.match(connectionString, /^postgres(?:ql)?:\/\//i)
  assert.ok(connectionString.includes('pooler.supabase.com'))
  assert.ok(!connectionString.includes('YOUR-DATABASE-PASSWORD'))
  pass('DATABASE_URL loaded and Supabase URL validated (value redacted)')

  currentStep = 'direct PostgreSQL connection query'
  database = getDatabase()
  const identity = await database.query(
    'SELECT current_database(), current_user, NOW();',
  )
  assert.equal(identity.rowCount, 1)
  assert.ok(identity.rows[0].current_database)
  assert.ok(identity.rows[0].current_user)
  assert.ok(identity.rows[0].now)
  pass('SELECT current_database(), current_user, NOW()')

  currentStep = 'public.tasks table and RLS check'
  const table = await database.query(`
    SELECT
      c.relrowsecurity AS rls_enabled,
      c.relforcerowsecurity AS rls_forced,
      (
        SELECT COUNT(*)::int
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'tasks'
          AND policyname IN (
            'tasks_select_own',
            'tasks_insert_own',
            'tasks_update_own',
            'tasks_delete_own'
          )
      ) AS own_policy_count
    FROM pg_class c
    WHERE c.oid = 'public.tasks'::regclass;
  `)
  assert.equal(table.rowCount, 1)
  assert.equal(table.rows[0].rls_enabled, true)
  assert.equal(table.rows[0].rls_forced, true)
  assert.equal(table.rows[0].own_policy_count, 4)
  await database.query(`
    SELECT id, user_id, title, description, status, priority, created_at, updated_at
    FROM public.tasks
    LIMIT 0;
  `)
  pass('public.tasks exists with owner column, forced RLS, and four per-user policies')

  currentStep = 'GET /api/health/db'
  let result = await request('/health/db')
  expectStatus(result.response, 200, currentStep)
  assert.equal(result.body.database, 'connected')
  pass(currentStep)

  currentStep = 'unauthenticated task endpoints'
  const unauthenticatedRequests = [
    ['/tasks', {}],
    ['/tasks/1', {}],
    ['/tasks', { method: 'POST', body: JSON.stringify({ title: 'No auth' }) }],
    ['/tasks/1', { method: 'PUT', body: JSON.stringify({ title: 'No auth' }) }],
    [
      '/tasks/1/status',
      { method: 'PATCH', body: JSON.stringify({ status: 'Completed' }) },
    ],
    ['/tasks/1', { method: 'DELETE' }],
  ]
  for (const [path, options] of unauthenticatedRequests) {
    const requestOptions = options.method
      ? {
          ...options,
          headers: { 'Content-Type': 'application/json' },
        }
      : options
    result = await request(path, requestOptions)
    expectStatus(result.response, 401, `${options.method || 'GET'} ${path}`)
  }
  pass('all task endpoints reject unauthenticated requests')

  currentStep = 'Supabase Auth test sign-in'
  await signInTestUser()

  currentStep = 'GET /api/tasks'
  result = await request('/tasks', {}, accessToken)
  expectStatus(result.response, 200, currentStep)
  assert.ok(Array.isArray(result.body))
  pass(`${currentStep} (${result.body.length} user-owned records returned; task content not logged)`)

  const testToken = randomUUID()
  const initialTask = {
    title: `Temporary integration test ${testToken}`,
    description: temporaryTaskDescription,
    priority: 'Low',
  }
  temporaryTaskTitles = [initialTask.title]

  currentStep = 'POST /api/tasks'
  result = await request(
    '/tasks',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialTask),
    },
    accessToken,
  )
  expectStatus(result.response, 201, currentStep)
  temporaryTaskId = result.body.id
  assert.equal(result.body.title, initialTask.title)
  assert.ok(
    (typeof temporaryTaskId === 'string' && /^\d+$/.test(temporaryTaskId)) ||
      Number.isSafeInteger(temporaryTaskId),
  )
  pass(currentStep)

  currentStep = 'other-user RLS isolation'
  await verifyOtherUserCannotRead(temporaryTaskId)
  pass('another authenticated user cannot read, update, or delete the temporary task')

  currentStep = 'GET /api/tasks/:id'
  result = await request(`/tasks/${temporaryTaskId}`, {}, accessToken)
  expectStatus(result.response, 200, currentStep)
  assert.equal(result.body.id, temporaryTaskId)
  assert.equal(result.body.title, initialTask.title)
  pass(currentStep)

  currentStep = 'PUT /api/tasks/:id'
  const updatedTask = {
    title: `Updated integration test ${testToken}`,
    description: updatedTaskDescription,
    priority: 'High',
  }
  temporaryTaskTitles.push(updatedTask.title)
  result = await request(
    `/tasks/${temporaryTaskId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTask),
    },
    accessToken,
  )
  expectStatus(result.response, 200, currentStep)
  assert.equal(result.body.title, updatedTask.title)
  assert.equal(result.body.description, updatedTask.description)
  assert.equal(result.body.priority, updatedTask.priority)
  pass(currentStep)

  currentStep = 'PATCH /api/tasks/:id/status'
  result = await request(
    `/tasks/${temporaryTaskId}/status`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Completed' }),
    },
    accessToken,
  )
  expectStatus(result.response, 200, currentStep)
  assert.equal(result.body.status, 'Completed')
  assert.equal(result.body.description, updatedTask.description)
  assert.equal(result.body.priority, updatedTask.priority)
  pass(currentStep)

  currentStep = 'DELETE /api/tasks/:id'
  const deletedTaskId = temporaryTaskId
  result = await request(`/tasks/${temporaryTaskId}`, { method: 'DELETE' }, accessToken)
  expectStatus(result.response, 204, currentStep)
  temporaryTaskId = undefined
  pass(currentStep)

  currentStep = 'GET deleted /api/tasks/:id'
  result = await request(`/tasks/${deletedTaskId}`, {}, accessToken)
  expectStatus(result.response, 404, currentStep)
  pass(currentStep)
}

try {
  await runIntegrationTest()
} catch (error) {
  const errorCode = error.code || error.cause?.code || error.name || 'UnknownError'
  console.error(`FAIL ${currentStep} (${errorCode}); details suppressed to protect credentials.`)
  process.exitCode = 1
} finally {
  if (temporaryTaskId !== undefined && accessToken) {
    try {
      const cleanup = await request(
        `/tasks/${temporaryTaskId}`,
        { method: 'DELETE' },
        accessToken,
      )
      if (cleanup.response.status === 204 || cleanup.response.status === 404) {
        pass('temporary task cleanup')
      } else {
        console.error(`FAIL temporary task cleanup (HTTP ${cleanup.response.status})`)
        process.exitCode = 1
      }
    } catch (error) {
      const errorCode = error.code || error.cause?.code || error.name || 'UnknownError'
      console.error(`FAIL temporary task cleanup (${errorCode}); details suppressed.`)
      process.exitCode = 1
    }
  }

  if (database && temporaryTaskTitles.length > 0) {
    try {
      const cleanup = await database.query(
        `
          DELETE FROM public.tasks
          WHERE title = ANY($1::varchar[])
            AND description = ANY($2::varchar[])
          RETURNING id;
        `,
        [
          temporaryTaskTitles,
          [temporaryTaskDescription, updatedTaskDescription],
        ],
      )
      if (cleanup.rowCount > 0) {
        pass('removed remaining temporary test row directly from PostgreSQL')
      }
    } catch (error) {
      const errorCode = error.code || error.cause?.code || error.name || 'UnknownError'
      console.error(`FAIL database safety cleanup (${errorCode}); details suppressed.`)
      process.exitCode = 1
    }
  }

  if (database) {
    try {
      await database.end()
    } catch {
      console.error('FAIL closing the PostgreSQL connection pool.')
      process.exitCode = 1
    }
  }
}
