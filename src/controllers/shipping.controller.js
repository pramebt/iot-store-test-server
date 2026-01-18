import * as shippingService from '../services/shipping.service.js'

export const calculateShipping = async (req, res) => {
  try {
    const { items, province } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Invalid items:', items)
      return res.status(400).json({ 
        message: 'Items array is required',
        received: { items, province }
      })
    }

    if (!province) {
      console.error('Province is missing')
      return res.status(400).json({ 
        message: 'Province is required',
        received: { items, province }
      })
    }

    const shippingInfo = await shippingService.calculateShippingInfo(items, province)
    res.json(shippingInfo)
  } catch (error) {
    console.error('Error calculating shipping:', error)
    res.status(400).json({ 
      message: 'Error calculating shipping', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}

export const checkProductAvailability = async (req, res) => {
  try {
    const { province } = req.query

    if (!province) {
      return res.status(400).json({ message: 'Province is required' })
    }

    const availability = await shippingService.checkProductShipping(req.params.id, province)
    res.json(availability)
  } catch (error) {
    res.status(400).json({ 
      message: 'Error checking product availability', 
      error: error.message 
    })
  }
}
