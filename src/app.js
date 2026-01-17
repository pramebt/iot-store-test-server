import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.routes.js'
import productsRoutes from './routes/products.routes.js'
import categoriesRoutes from './routes/categories.routes.js'
import ordersRoutes from './routes/orders.routes.js'
import customersRoutes from './routes/customers.routes.js'
import analyticsRoutes from './routes/analytics.routes.js'

import { errorMiddleware } from './middleware/error.middleware.js'

dotenv.config()

export const app = express()

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))

// Increase body size limit to handle base64 image uploads (up to 10MB)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/customers', customersRoutes)
app.use('/api/analytics', analyticsRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

app.get('/', (req, res) => {
  res.json({ 
    message: 'BD Store API', 
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      customers: '/api/customers',
      analytics: '/api/analytics',
    }
  })
})

// Error handling
app.use(errorMiddleware)

export default app
