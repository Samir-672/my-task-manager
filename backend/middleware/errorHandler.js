export function errorHandler(error, _request, response, _next) {
  // Express needs this middleware's four-argument signature for error handling.
  void _next

  const statusCode = Number.isInteger(error.statusCode)
    ? error.statusCode
    : Number.isInteger(error.status)
      ? error.status
      : 500

  if (statusCode >= 500) {
    // Log only a code; database errors can contain connection details.
    const code = error.code || error.name || 'UnknownError'
    console.error(`API request failed with status ${statusCode} (${code}).`)
  }

  const message =
    statusCode === 500
      ? 'The server could not complete the request. Check the API logs and database connection.'
      : error.message

  response.status(statusCode).json({ error: message })
}
