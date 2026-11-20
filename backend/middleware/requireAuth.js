const userIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function createAuthError(message, statusCode) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function isPublicSupabaseKey(key) {
  if (key.startsWith('sb_publishable_')) {
    return true
  }

  const payload = key.split('.')[1]
  if (!payload) {
    return false
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
    return claims.role === 'anon'
  } catch {
    return false
  }
}

export async function requireAuth(request, _response, next) {
  try {
    const authorization = request.get('authorization') || ''
    const tokenMatch = /^Bearer\s+([^\s]+)$/i.exec(authorization)
    if (!tokenMatch || tokenMatch[1].length > 8192) {
      throw createAuthError('A valid sign-in session is required.', 401)
    }

    const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '')
    const anonKey = process.env.SUPABASE_ANON_KEY?.trim()
    if (!supabaseUrl || !anonKey || !isPublicSupabaseKey(anonKey)) {
      throw createAuthError(
        'Supabase Auth requires a project URL and public anon/publishable key.',
        503,
      )
    }

    let authUrl
    try {
      authUrl = new URL(supabaseUrl)
    } catch {
      throw createAuthError('Supabase Auth configuration is invalid.', 503)
    }
    if (authUrl.protocol !== 'https:') {
      throw createAuthError('Supabase Auth must use HTTPS.', 503)
    }

    let response
    try {
      response = await fetch(new URL('/auth/v1/user', authUrl), {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${tokenMatch[1]}`,
        },
        signal: AbortSignal.timeout(10_000),
      })
    } catch {
      throw createAuthError('Supabase Auth is unavailable.', 503)
    }

    if (response.status === 401 || response.status === 403) {
      throw createAuthError('The sign-in session is invalid or expired.', 401)
    }
    if (!response.ok) {
      throw createAuthError('Supabase Auth could not verify the session.', 503)
    }

    const user = await response.json()
    if (typeof user.id !== 'string' || !userIdPattern.test(user.id)) {
      throw createAuthError('The sign-in session is invalid.', 401)
    }

    request.authUser = { id: user.id }
    next()
  } catch (error) {
    next(error)
  }
}
