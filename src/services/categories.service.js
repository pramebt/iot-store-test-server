import { db } from '../utils/db.js'

export const getAll = async () => {
  return await db.category.findMany({
    where: { status: 'Active' },
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export const getById = async (id) => {
  return await db.category.findUnique({
    where: { id },
    include: {
      products: {
        where: { status: 'Active' },
      },
    },
  })
}

export const create = async (data) => {
  return await db.category.create({
    data: {
      name: data.name,
      description: data.description || null,
      status: data.status || 'Active',
    },
  })
}

export const update = async (id, data) => {
  const updateData = {}
  
  if (data.name) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description

  return await db.category.update({
    where: { id },
    data: updateData,
  })
}

export const deleteCategory = async (id) => {
  // Check if category has products
  const category = await db.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  })

  if (!category) {
    throw new Error('Category not found')
  }

  // Check if there are any products (including inactive ones)
  const productCount = await db.product.count({
    where: { categoryId: id },
  })

  if (productCount > 0) {
    throw new Error(`Cannot delete category. There are ${productCount} product(s) using this category. Please remove or reassign products first.`)
  }

  // If no products, set status to Inactive (soft delete)
  return await db.category.update({
    where: { id },
    data: { status: 'Inactive' },
  })
}
