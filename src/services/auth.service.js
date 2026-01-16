import { db } from '../utils/db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export const register = async (data) => {
  const existingUser = await db.user.findUnique({
    where: { email: data.email },
  })

  if (existingUser) {
    throw new Error('Email already exists')
  }

  const hashedPassword = await bcrypt.hash(data.password, 10)

  const user = await db.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      phone: data.phone || null,
      address: data.address || null,
      province: data.province || null,
      district: data.district || null,
      postalCode: data.postalCode || null,
      role: data.role || 'CUSTOMER',
    },
  })

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  )

  const { password, ...userWithoutPassword } = user

  return { user: userWithoutPassword, token }
}

export const login = async (email, password) => {
  const user = await db.user.findUnique({
    where: { email },
  })

  if (!user) {
    throw new Error('Invalid credentials')
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    throw new Error('Invalid credentials')
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  )

  const { password: _, ...userWithoutPassword } = user

  return { user: userWithoutPassword, token }
}

export const getProfile = async (userId) => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      address: true,
      province: true,
      district: true,
      postalCode: true,
      createdAt: true,
    },
  })

  return user
}

export const updateProfile = async (userId, data) => {
  const updateData = {}
  
  if (data.name) updateData.name = data.name
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.address !== undefined) updateData.address = data.address
  if (data.province !== undefined) updateData.province = data.province
  if (data.district !== undefined) updateData.district = data.district
  if (data.postalCode !== undefined) updateData.postalCode = data.postalCode

  const user = await db.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      phone: true,
      address: true,
      province: true,
      district: true,
      postalCode: true,
    },
  })

  return user
}

export const changePassword = async (userId, oldPassword, newPassword) => {
  // Validate input
  if (!oldPassword || !newPassword) {
    throw new Error('Current password and new password are required')
  }

  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long')
  }

  const user = await db.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user.password)

  if (!isPasswordValid) {
    throw new Error('Current password is incorrect')
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await db.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  })

  return { message: 'Password changed successfully' }
}
