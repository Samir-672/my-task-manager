import { Router } from 'express'
import {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  updateTask,
  updateTaskStatus,
} from '../controllers/taskController.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.use(requireAuth)
router.get('/', asyncHandler(getTasks))
router.get('/:id', asyncHandler(getTask))
router.post('/', asyncHandler(createTask))
router.put('/:id', asyncHandler(updateTask))
router.patch('/:id/status', asyncHandler(updateTaskStatus))
router.delete('/:id', asyncHandler(deleteTask))

export default router
