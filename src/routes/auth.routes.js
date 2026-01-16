import { Router } from 'express'
import * as authController from '../controllers/auth.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

export const router = Router()

// Public routes
router.post('/register', authController.register)
router.post('/login', authController.login)

// Protected routes
router.get('/me', authMiddleware, authController.getProfile)
router.put('/profile', authMiddleware, authController.updateProfile)
router.put('/password', authMiddleware, authController.changePassword)

export default router
