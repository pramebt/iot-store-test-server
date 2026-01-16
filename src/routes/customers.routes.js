import express from 'express'
import * as customersController from '../controllers/customers.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'

const router = express.Router()

// All routes require authentication (admin check in controller if needed)
router.use(authMiddleware)

// GET /api/customers - Get all customers
router.get('/', customersController.getAll)

// GET /api/customers/stats - Get customer statistics
router.get('/stats', customersController.getStats)

// GET /api/customers/:id - Get customer by ID
router.get('/:id', customersController.getById)

export default router
