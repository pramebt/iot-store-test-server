import { Router } from 'express'
import * as deliveryAddressesController from '../controllers/deliveryAddresses.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { adminMiddleware } from '../middleware/admin.middleware.js'

export const router = Router()

// Public routes
router.get('/', deliveryAddressesController.getAll)
router.get('/:id', deliveryAddressesController.getById)

// Protected routes (Admin only)
router.post('/', authMiddleware, adminMiddleware, deliveryAddressesController.create)
router.put('/:id', authMiddleware, adminMiddleware, deliveryAddressesController.update)
router.delete('/:id', authMiddleware, adminMiddleware, deliveryAddressesController.remove)

// DeliveryAddress = สถานที่ส่งสินค้า (ไม่มี stock) → ไม่มี stock management routes

export default router
