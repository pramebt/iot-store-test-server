import * as customersService from '../services/customers.service.js'

export const getAll = async (req, res) => {
  try {
    const { search, province, page = 1, limit = 10 } = req.query
    
    const params = {
      search: search || undefined,
      province: province || undefined,
      page: Number(page),
      limit: Number(limit),
    }

    const result = await customersService.getAll(params)
    res.json(result)
  } catch (error) {
    console.error('Error fetching customers:', error)
    res.status(500).json({ 
      message: 'Error fetching customers', 
      error: error.message 
    })
  }
}

export const getStats = async (req, res) => {
  try {
    const stats = await customersService.getStats()
    res.json(stats)
  } catch (error) {
    console.error('Error fetching customer stats:', error)
    res.status(500).json({ 
      message: 'Error fetching customer stats', 
      error: error.message 
    })
  }
}

export const getById = async (req, res) => {
  try {
    const customer = await customersService.getById(req.params.id)
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }

    res.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    res.status(500).json({ 
      message: 'Error fetching customer', 
      error: error.message 
    })
  }
}
