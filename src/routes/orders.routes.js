import { Router } from 'express'
import * as ordersController from '../controllers/orders.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { adminMiddleware } from '../middleware/admin.middleware.js'

export const router = Router()

// All order routes require authentication
router.use(authMiddleware)

// Customer routes
router.get('/', ordersController.getAll)
router.get('/:id', ordersController.getById)
router.post('/', ordersController.create)
router.post('/:id/payment', ordersController.uploadPayment)
router.delete('/:id', ordersController.cancel)

// Admin routes
router.put('/:id/status', adminMiddleware, ordersController.updateStatus)
router.put('/:id/tracking', adminMiddleware, ordersController.addTracking)

export default router
