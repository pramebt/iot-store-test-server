import { db } from '../utils/db.js'

export const getAll = async (params = {}) => {
  const where = { status: 'Active' }

  if (params.category) {
    where.categoryId = params.category
  }

  const skip = ((params.page || 1) - 1) * (params.limit || 20)

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: params.limit || 20,
    }),
    db.product.count({ where }),
  ])

  return {
    products,
    total,
    page: params.page || 1,
    limit: params.limit || 20,
    totalPages: Math.ceil(total / (params.limit || 20)),
  }
}

export const getById = async (id) => {
  return await db.product.findUnique({
    where: { id },
    include: {
      category: true,
    },
  })
}

export const create = async (data) => {
  return await db.product.create({
    data: {
      name: data.name,
      description: data.description,
      cost: data.cost || 0,
      basePrice: data.basePrice || data.price, // Default to price if not provided
      price: data.price,
      stock: data.stock,
      imageUrl: data.imageUrl,
      categoryId: data.categoryId,
    },
    include: {
      category: true,
    },
  })
}

export const update = async (id, data) => {
  const updateData = {}
  
  if (data.name) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.cost !== undefined) updateData.cost = data.cost
  if (data.basePrice !== undefined) updateData.basePrice = data.basePrice
  if (data.price !== undefined) updateData.price = data.price
  if (data.stock !== undefined) updateData.stock = data.stock
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
  if (data.categoryId) updateData.categoryId = data.categoryId

  return await db.product.update({
    where: { id },
    data: updateData,
    include: {
      category: true,
    },
  })
}

export const deleteProduct = async (id) => {
  return await db.product.update({
    where: { id },
    data: { status: 'Inactive' },
  })
}
