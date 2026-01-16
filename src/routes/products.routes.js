import { Router } from 'express'
import * as productsController from '../controllers/products.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { adminMiddleware } from '../middleware/admin.middleware.js'

export const router = Router()

// Public routes
router.get('/', productsController.getAll)
router.get('/:id', productsController.getById)

// Protected routes (Admin only)
router.post('/', authMiddleware, adminMiddleware, productsController.create)
router.put('/:id', authMiddleware, adminMiddleware, productsController.update)
router.delete('/:id', authMiddleware, adminMiddleware, productsController.deleteProduct)

export default router
