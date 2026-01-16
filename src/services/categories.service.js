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
      description: data.description,
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
  return await db.category.update({
    where: { id },
    data: { status: 'Inactive' },
  })
}
