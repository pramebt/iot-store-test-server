import * as categoriesService from '../services/categories.service.js'

export const getAll = async (req, res) => {
  try {
    const categories = await categoriesService.getAll()
    res.json(categories)
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching categories', 
      error: error.message 
    })
  }
}

export const getById = async (req, res) => {
  try {
    const category = await categoriesService.getById(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }
    res.json(category)
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching category', 
      error: error.message 
    })
  }
}

export const create = async (req, res) => {
  try {
    const category = await categoriesService.create(req.body)
    res.status(201).json(category)
  } catch (error) {
    res.status(400).json({ 
      message: 'Error creating category', 
      error: error.message 
    })
  }
}

export const update = async (req, res) => {
  try {
    const category = await categoriesService.update(req.params.id, req.body)
    res.json(category)
  } catch (error) {
    res.status(400).json({ 
      message: 'Error updating category', 
      error: error.message 
    })
  }
}

export const deleteCategory = async (req, res) => {
  try {
    await categoriesService.deleteCategory(req.params.id)
    res.json({ message: 'Category deleted successfully' })
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting category',
      error: error.message 
    })
  }
}
