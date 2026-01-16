import { Router } from 'express'
import * as analyticsController from '../controllers/analytics.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { adminMiddleware } from '../middleware/admin.middleware.js'

export const router = Router()

// All analytics routes require admin access
router.use(authMiddleware, adminMiddleware)

router.get('/summary', analyticsController.getSummary)
router.get('/sales/province', analyticsController.getSalesByProvince)
router.get('/sales/history', analyticsController.getSalesHistory)
router.get('/top-provinces', analyticsController.getTopProvinces)
router.get('/top-products', analyticsController.getTopProducts)

export default router
