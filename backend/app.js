import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import taskRoutes from './routes/taskRoutes.js'
import { getDatabase } from './config/database.js'
import { errorHandler } from './middleware/errorHandler.js'
import { asyncHandler } from './utils/asyncHandler.js'

const app = express()
const allowedOrigins = (
  process.env.FRONTEND_ORIGIN ||
  'http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

// Only the configured frontend origin can make browser requests to this API.
app.use(
  cors({
    origin: allowedOrigins,
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.get(
  '/api/health/db',
  asyncHandler(async (_request, response) => {
    await getDatabase().query('SELECT 1;')
    response.json({ status: 'ok', database: 'connected' })
  }),
)

app.use('/api/tasks', taskRoutes)

app.use((_request, _response, next) => {
  const error = new Error('API endpoint not found.')
  error.statusCode = 404
  next(error)
})

app.use(errorHandler)

export default app
