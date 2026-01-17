import { Router } from 'express'
import * as shippingController from '../controllers/shipping.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

export const router = Router()

// Public routes (for checkout calculation)
router.post('/calculate', shippingController.calculateShipping)
router.get('/products/:id/availability', shippingController.checkProductAvailability)

export default router
