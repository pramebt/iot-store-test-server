import { db } from '../utils/db.js'

export const getAll = async (params = {}) => {
  const where = {}

  // Status filter
  if (params.status) {
    where.status = params.status
  } else {
    where.status = 'Active' // Default: only active
  }

  // Search by name or code
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { code: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  // Province filter
  if (params.province) {
    where.province = params.province
  }

  // Pagination
  const page = params.page ? parseInt(params.page) : 1
  const limit = params.limit ? parseInt(params.limit) : 20
  const skip = (page - 1) * limit

  const [deliveryAddresses, total] = await Promise.all([
    db.deliveryAddress.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    }),
    db.deliveryAddress.count({ where }),
  ])

  return {
    deliveryAddresses,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export const getById = async (id) => {
  const deliveryAddress = await db.deliveryAddress.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
  })

  if (!deliveryAddress) {
    throw new Error('Delivery address not found')
  }

  return deliveryAddress
}

export const create = async (data) => {
  // Check if code already exists
  const existing = await db.deliveryAddress.findUnique({
    where: { code: data.code },
  })

  if (existing) {
    throw new Error('Delivery address code already exists')
  }

  const deliveryAddress = await db.deliveryAddress.create({
    data: {
      name: data.name,
      code: data.code,
      address: data.address,
      province: data.province,
      district: data.district,
      postalCode: data.postalCode,
      phone: data.phone,
      email: data.email,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      locationType: data.locationType || 'WAREHOUSE',
      status: data.status || 'Active',
    },
  })

  return deliveryAddress
}

export const update = async (id, data) => {
  const deliveryAddress = await db.deliveryAddress.findUnique({
    where: { id },
  })

  if (!deliveryAddress) {
    throw new Error('Delivery address not found')
  }

  // Check if code is being changed and already exists
  if (data.code && data.code !== deliveryAddress.code) {
    const existing = await db.deliveryAddress.findUnique({
      where: { code: data.code },
    })

    if (existing) {
      throw new Error('Delivery address code already exists')
    }
  }

  const updated = await db.deliveryAddress.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.code && { code: data.code }),
      ...(data.address && { address: data.address }),
      ...(data.province && { province: data.province }),
      ...(data.district && { district: data.district }),
      ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.latitude !== undefined && { latitude: data.latitude ? parseFloat(data.latitude) : null }),
      ...(data.longitude !== undefined && { longitude: data.longitude ? parseFloat(data.longitude) : null }),
      ...(data.locationType && { locationType: data.locationType }),
      ...(data.status && { status: data.status }),
    },
  })

  return updated
}

export const remove = async (id) => {
  const deliveryAddress = await db.deliveryAddress.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
  })

  if (!deliveryAddress) {
    throw new Error('Delivery address not found')
  }

  // Check if there are orders associated
  if (deliveryAddress._count.orders > 0) {
    throw new Error('Cannot delete delivery address with associated orders')
  }

  await db.deliveryAddress.delete({
    where: { id },
  })

  return { message: 'Delivery address deleted successfully' }
}

// DeliveryAddress = สถานที่ส่งสินค้า (ไม่มี stock) → ไม่มี stock management methods
// Stock management ใช้กับ SalesLocation เท่านั้น
