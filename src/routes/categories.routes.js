import { Router } from 'express'
import * as categoriesController from '../controllers/categories.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { adminMiddleware } from '../middleware/admin.middleware.js'

export const router = Router()

// Public routes
router.get('/', categoriesController.getAll)
router.get('/:id', categoriesController.getById)

// Protected routes (Admin only)
router.post('/', authMiddleware, adminMiddleware, categoriesController.create)
router.put('/:id', authMiddleware, adminMiddleware, categoriesController.update)
router.delete('/:id', authMiddleware, adminMiddleware, categoriesController.deleteCategory)

export default router
