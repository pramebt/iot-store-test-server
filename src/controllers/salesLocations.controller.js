import * as salesLocationsService from '../services/salesLocations.service.js'

export const getAll = async (req, res) => {
  try {
    const result = await salesLocationsService.getAll(req.query)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sales locations', error: error.message })
  }
}

export const getById = async (req, res) => {
  try {
    const salesLocation = await salesLocationsService.getById(req.params.id)
    res.json(salesLocation)
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
}

export const create = async (req, res) => {
  try {
    const salesLocation = await salesLocationsService.create(req.body)
    res.status(201).json(salesLocation)
  } catch (error) {
    res.status(400).json({ message: 'Error creating sales location', error: error.message })
  }
}

export const update = async (req, res) => {
  try {
    const salesLocation = await salesLocationsService.update(req.params.id, req.body)
    res.json(salesLocation)
  } catch (error) {
    res.status(400).json({ message: 'Error updating sales location', error: error.message })
  }
}

export const remove = async (req, res) => {
  try {
    const result = await salesLocationsService.remove(req.params.id)
    res.json(result)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const getProducts = async (req, res) => {
  try {
    const products = await salesLocationsService.getProducts(req.params.id)
    res.json(products)
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
}

export const getStock = async (req, res) => {
  try {
    const result = await salesLocationsService.getStock(req.params.id, req.query)
    res.json(result)
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
}

export const addProduct = async (req, res) => {
  try {
    const { productId, isAvailable, stock } = req.body
    const result = await salesLocationsService.addProduct(
      req.params.id, 
      productId, 
      isAvailable !== false, 
      stock || 0
    )
    res.status(201).json(result)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const updateStock = async (req, res) => {
  try {
    const { productId, quantity, action } = req.body
    const result = await salesLocationsService.updateStock(
      req.params.id,
      productId,
      quantity,
      action || 'SET'
    )
    res.json(result)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const removeProduct = async (req, res) => {
  try {
    const { productId } = req.body
    const result = await salesLocationsService.removeProduct(req.params.id, productId)
    res.json(result)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

export const transferStock = async (req, res) => {
  try {
    const { toSalesLocationId, productId, quantity } = req.body
    const result = await salesLocationsService.transferStock(
      req.params.id,
      toSalesLocationId,
      productId,
      quantity
    )
    res.json(result)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
