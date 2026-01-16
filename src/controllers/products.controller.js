import * as productsService from '../services/products.service.js'

export const getAll = async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query
    const products = await productsService.getAll({
      category: category || undefined,
      page: Number(page),
      limit: Number(limit),
    })
    res.json(products)
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching products', 
      error: error.message 
    })
  }
}

export const getById = async (req, res) => {
  try {
    const product = await productsService.getById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.json(product)
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching product', 
      error: error.message 
    })
  }
}

export const create = async (req, res) => {
  try {
    const product = await productsService.create(req.body)
    res.status(201).json(product)
  } catch (error) {
    res.status(400).json({ 
      message: 'Error creating product', 
      error: error.message 
    })
  }
}

export const update = async (req, res) => {
  try {
    const product = await productsService.update(req.params.id, req.body)
    res.json(product)
  } catch (error) {
    res.status(400).json({ 
      message: 'Error updating product', 
      error: error.message 
    })
  }
}

export const deleteProduct = async (req, res) => {
  try {
    await productsService.deleteProduct(req.params.id)
    res.json({ message: 'Product deleted successfully' })
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting product',
      error: error.message 
    })
  }
}
