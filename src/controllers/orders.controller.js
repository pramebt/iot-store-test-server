import * as ordersService from '../services/orders.service.js'

export const getAll = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    
    const params = {
      status: status || undefined,
      page: Number(page),
      limit: Number(limit),
    }

    // If not admin, only show own orders
    if (req.user.role !== 'ADMIN') {
      params.customerId = req.user.id
    }

    const orders = await ordersService.getAll(params)
    res.json(orders)
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching orders', 
      error: error.message 
    })
  }
}

export const getById = async (req, res) => {
  try {
    const order = await ordersService.getById(req.params.id)
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // Check if user owns this order or is admin
    if (req.user.role !== 'ADMIN' && order.customerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.json(order)
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching order', 
      error: error.message 
    })
  }
}

export const create = async (req, res) => {
  try {
    const order = await ordersService.create(req.user.id, req.body)
    res.status(201).json(order)
  } catch (error) {
    res.status(400).json({ 
      message: 'Error creating order', 
      error: error.message 
    })
  }
}

export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body
    const order = await ordersService.updateStatus(req.params.id, status)
    res.json(order)
  } catch (error) {
    res.status(400).json({ 
      message: 'Error updating order status', 
      error: error.message 
    })
  }
}

export const addTracking = async (req, res) => {
  try {
    const { trackingNumber } = req.body
    const order = await ordersService.addTracking(req.params.id, trackingNumber)
    res.json(order)
  } catch (error) {
    res.status(400).json({ 
      message: 'Error adding tracking number', 
      error: error.message 
    })
  }
}

export const uploadPayment = async (req, res) => {
  try {
    // In a real app, you'd upload the file and get the URL
    const paymentImage = req.body.paymentImage || req.file?.path
    
    if (!paymentImage) {
      return res.status(400).json({ message: 'Payment image required' })
    }

    const order = await ordersService.uploadPayment(req.params.id, paymentImage)
    res.json(order)
  } catch (error) {
    res.status(400).json({ 
      message: 'Error uploading payment', 
      error: error.message 
    })
  }
}

export const cancel = async (req, res) => {
  try {
    const order = await ordersService.cancel(req.params.id)
    res.json(order)
  } catch (error) {
    res.status(400).json({ 
      message: 'Error cancelling order', 
      error: error.message 
    })
  }
}
