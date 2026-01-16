import * as authService from '../services/auth.service.js'

export const register = async (req, res) => {
  try {
    const result = await authService.register(req.body)
    res.status(201).json(result)
  } catch (error) {
    res.status(400).json({ 
      message: 'Registration failed', 
      error: error.message 
    })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const result = await authService.login(email, password)
    res.json(result)
  } catch (error) {
    res.status(401).json({ 
      message: 'Login failed', 
      error: error.message 
    })
  }
}

export const getProfile = async (req, res) => {
  try {
    const user = await authService.getProfile(req.user.id)
    res.json(user)
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching profile', 
      error: error.message 
    })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body)
    res.json(user)
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating profile', 
      error: error.message 
    })
  }
}

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword)
    res.json(result)
  } catch (error) {
    res.status(400).json({ 
      message: 'Error changing password', 
      error: error.message 
    })
  }
}
