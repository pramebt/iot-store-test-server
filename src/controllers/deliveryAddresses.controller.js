import * as deliveryAddressesService from '../services/deliveryAddresses.service.js'

export const getAll = async (req, res) => {
  try {
    const result = await deliveryAddressesService.getAll(req.query)
    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching delivery addresses', error: error.message })
  }
}

export const getById = async (req, res) => {
  try {
    const deliveryAddress = await deliveryAddressesService.getById(req.params.id)
    res.json(deliveryAddress)
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
}

export const create = async (req, res) => {
  try {
    const deliveryAddress = await deliveryAddressesService.create(req.body)
    res.status(201).json(deliveryAddress)
  } catch (error) {
    res.status(400).json({ message: 'Error creating delivery address', error: error.message })
  }
}

export const update = async (req, res) => {
  try {
    const deliveryAddress = await deliveryAddressesService.update(req.params.id, req.body)
    res.json(deliveryAddress)
  } catch (error) {
    res.status(400).json({ message: 'Error updating delivery address', error: error.message })
  }
}

export const remove = async (req, res) => {
  try {
    const result = await deliveryAddressesService.remove(req.params.id)
    res.json(result)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// DeliveryAddress = สถานที่ส่งสินค้า (ไม่มี stock) → ไม่มี stock management controllers
