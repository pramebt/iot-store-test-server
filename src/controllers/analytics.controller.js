import * as analyticsService from '../services/analytics.service.js'

export const getSummary = async (req, res) => {
  try {
    const summary = await analyticsService.getSummary()
    res.json(summary)
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching analytics summary',
      error: error.message,
    })
  }
}

export const getSalesByProvince = async (req, res) => {
  try {
    const data = await analyticsService.getSalesByProvince()
    res.json(data)
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching sales by province',
      error: error.message,
    })
  }
}

export const getSalesHistory = async (req, res) => {
  try {
    const months = Number(req.query.months) || 12
    const data = await analyticsService.getSalesHistory(months)
    res.json(data)
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching sales history',
      error: error.message,
    })
  }
}

export const getTopProvinces = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10
    const data = await analyticsService.getTopProvinces(limit)
    res.json(data)
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching top provinces',
      error: error.message,
    })
  }
}

export const getTopProducts = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10
    const data = await analyticsService.getTopProducts(limit)
    res.json(data)
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching top products',
      error: error.message,
    })
  }
}
