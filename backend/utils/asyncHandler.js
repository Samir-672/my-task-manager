// This wrapper forwards rejected async route handlers to the central error middleware.
export function asyncHandler(handler) {
  return async (request, response, next) => {
    try {
      await handler(request, response, next)
    } catch (error) {
      next(error)
    }
  }
}
