import { readFileSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const { Pool } = pg
const backendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
let pool

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL?.trim()

  if (!connectionString || connectionString.includes('YOUR-DATABASE-PASSWORD')) {
    const error = new Error(
      'Supabase is not configured. Replace the password placeholder in backend/.env.',
    )
    error.statusCode = 503
    throw error
  }

  // Pool reuses PostgreSQL connections and verifies Supabase's TLS certificate.
  if (!pool) {
    const configuredCaPath = process.env.DATABASE_SSL_CA?.trim() || 'supabase-root.crt'
    const caPath = isAbsolute(configuredCaPath)
      ? configuredCaPath
      : resolve(backendDirectory, configuredCaPath)
    let ca

    try {
      ca = readFileSync(caPath, 'utf8')
    } catch (readError) {
      if (readError.code === 'ENOENT') {
        const error = new Error(
          'Supabase root CA certificate is missing. Add backend/supabase-root.crt or set DATABASE_SSL_CA.',
        )
        error.statusCode = 503
        throw error
      }

      throw readError
    }

    pool = new Pool({
      connectionString,
      ssl: { ca, rejectUnauthorized: true },
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    })

    pool.on('error', (error) => {
      const code = error.code || error.name || 'UnknownError'
      console.error(`Unexpected error from an idle PostgreSQL client (${code}).`)
    })
  }

  return pool
}

export async function withUserDatabase(userId, callback) {
  if (
    typeof userId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      userId,
    )
  ) {
    const error = new Error('An authenticated user is required.')
    error.statusCode = 401
    throw error
  }

  const client = await getDatabase().connect()
  let transactionStarted = false

  try {
    await client.query('BEGIN')
    transactionStarted = true
    await client.query('SET LOCAL ROLE authenticated')
    await client.query(
      `
        SELECT
          set_config('request.jwt.claims', $1, true),
          set_config('request.jwt.claim.sub', $2, true);
      `,
      [JSON.stringify({ sub: userId, role: 'authenticated' }), userId],
    )

    const result = await callback(client)
    await client.query('COMMIT')
    transactionStarted = false
    return result
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        const code = rollbackError.code || rollbackError.name || 'UnknownError'
        console.error(`PostgreSQL rollback failed (${code}).`)
      }
    }

    throw error
  } finally {
    client.release()
  }
}
