import { Router } from 'express'
import * as salesLocationsController from '../controllers/salesLocations.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { adminMiddleware } from '../middleware/admin.middleware.js'

export const router = Router()

// Public routes
router.get('/', salesLocationsController.getAll)
router.get('/:id', salesLocationsController.getById)
router.get('/:id/products', salesLocationsController.getProducts)
router.get('/:id/stock', salesLocationsController.getStock)

// Protected routes (Admin only)
router.post('/', authMiddleware, adminMiddleware, salesLocationsController.create)
router.put('/:id', authMiddleware, adminMiddleware, salesLocationsController.update)
router.delete('/:id', authMiddleware, adminMiddleware, salesLocationsController.remove)
router.post('/:id/products', authMiddleware, adminMiddleware, salesLocationsController.addProduct)
router.delete('/:id/products', authMiddleware, adminMiddleware, salesLocationsController.removeProduct)
router.put('/:id/stock', authMiddleware, adminMiddleware, salesLocationsController.updateStock)
router.post('/:id/transfer', authMiddleware, adminMiddleware, salesLocationsController.transferStock)

export default router
