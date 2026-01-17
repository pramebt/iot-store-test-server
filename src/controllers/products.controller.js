import * as productsService from '../services/products.service.js'
import { getProductAvailability } from '../services/productAvailability.service.js'

export const getAll = async (req, res) => {
  try {
    const { 
      category, 
      search,
      minPrice,
      maxPrice,
      sortBy,
      order,
      page = 1, 
      limit = 20 
    } = req.query
    
    const products = await productsService.getAll({
      category: category || undefined,
      search: search || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sortBy: sortBy || undefined,
      order: order || undefined,
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
    // Return in format expected by frontend
    res.json({ product })
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching product', 
      error: error.message 
    })
  }
}

export const getAvailability = async (req, res) => {
  try {
    const { province } = req.query
    
    // Province is optional - if not provided, show all locations
    const availability = await getProductAvailability(req.params.id, province || null)
    res.json(availability)
  } catch (error) {
    console.error('Error in getAvailability:', error)
    res.status(500).json({ 
      message: 'Error checking product availability', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

export const uploadImage = async (req, res) => {
  try {
    // Support both base64 from body and file upload
    let imageData;
    
    if (req.file) {
      // If using multer file upload
      const fs = await import('fs');
      const imageBuffer = fs.readFileSync(req.file.path);
      imageData = `data:${req.file.mimetype};base64,${imageBuffer.toString('base64')}`;
      // Clean up temp file
      fs.unlinkSync(req.file.path);
    } else if (req.body.image) {
      // If sending base64 directly
      imageData = req.body.image;
    } else {
      return res.status(400).json({ message: 'No image provided' });
    }

    const product = await productsService.uploadImage(req.params.id, imageData);
    res.json({ product, message: 'Image uploaded successfully' });
  } catch (error) {
    res.status(400).json({ 
      message: 'Error uploading image', 
      error: error.message 
    });
  }
}
