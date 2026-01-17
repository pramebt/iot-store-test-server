import { Router } from 'express'
import * as productsController from '../controllers/products.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { adminMiddleware } from '../middleware/admin.middleware.js'

export const router = Router()

// Public routes
router.get('/', productsController.getAll)
// More specific route must come before generic :id route
router.get('/:id/availability', productsController.getAvailability)
router.get('/:id', productsController.getById)

// Protected routes (Admin only)
router.post('/', authMiddleware, adminMiddleware, productsController.create)
router.put('/:id', authMiddleware, adminMiddleware, productsController.update)
router.post('/:id/image', authMiddleware, adminMiddleware, productsController.uploadImage)
router.delete('/:id', authMiddleware, adminMiddleware, productsController.deleteProduct)

export default router
