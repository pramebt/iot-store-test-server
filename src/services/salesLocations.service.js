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

  const [salesLocations, total] = await Promise.all([
    db.salesLocation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            orders: true,
            products: true,
          },
        },
      },
    }),
    db.salesLocation.count({ where }),
  ])

  return {
    salesLocations,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export const getById = async (id) => {
  const salesLocation = await db.salesLocation.findUnique({
    where: { id },
    include: {
      products: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
      _count: {
        select: {
          orders: true,
          products: true,
        },
      },
    },
  })

  if (!salesLocation) {
    throw new Error('Sales location not found')
  }

  return salesLocation
}

export const create = async (data) => {
  // Check if code already exists
  const existing = await db.salesLocation.findUnique({
    where: { code: data.code },
  })

  if (existing) {
    throw new Error('Sales location code already exists')
  }

  const salesLocation = await db.salesLocation.create({
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
      locationType: data.locationType || 'STORE',
      status: data.status || 'Active',
    },
  })

  return salesLocation
}

export const update = async (id, data) => {
  const salesLocation = await db.salesLocation.findUnique({
    where: { id },
  })

  if (!salesLocation) {
    throw new Error('Sales location not found')
  }

  // Check if code is being changed and already exists
  if (data.code && data.code !== salesLocation.code) {
    const existing = await db.salesLocation.findUnique({
      where: { code: data.code },
    })

    if (existing) {
      throw new Error('Sales location code already exists')
    }
  }

  const updated = await db.salesLocation.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.code && { code: data.code }),
      ...(data.address && { address: data.address }),
      ...(data.province && { province: data.province }),
      ...(data.district && { district: data.district }),
      ...(data.postalCode !== undefined && { postalCode: data.postalCode }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.latitude !== undefined && { latitude: data.latitude ? parseFloat(data.latitude) : null }),
      ...(data.longitude !== undefined && { longitude: data.longitude ? parseFloat(data.longitude) : null }),
      ...(data.locationType && { locationType: data.locationType }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.status && { status: data.status }),
    },
  })

  return updated
}

export const remove = async (id) => {
  const salesLocation = await db.salesLocation.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
  })

  if (!salesLocation) {
    throw new Error('Sales location not found')
  }

  // Check if there are orders associated
  if (salesLocation._count.orders > 0) {
    throw new Error('Cannot delete sales location with associated orders')
  }

  await db.salesLocation.delete({
    where: { id },
  })

  return { message: 'Sales location deleted successfully' }
}

export const getProducts = async (id) => {
  const salesLocation = await db.salesLocation.findUnique({
    where: { id },
  })

  if (!salesLocation) {
    throw new Error('Sales location not found')
  }

  const products = await db.productSalesLocation.findMany({
    where: { salesLocationId: id },
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
  })

  return products.map((psl) => ({
    id: psl.id,
    productId: psl.productId,
    product: psl.product,
    isAvailable: psl.isAvailable,
    stock: psl.stock || 0, // แสดง stock
  }))
}

/**
 * Get stock for a sales location (with pagination and filters)
 * SalesLocation = สถานที่ขายและเก็บสินค้า (มี stock)
 */
export const getStock = async (salesLocationId, params = {}) => {
  const salesLocation = await db.salesLocation.findUnique({
    where: { id: salesLocationId },
  })

  if (!salesLocation) {
    throw new Error('Sales location not found')
  }

  const where = { salesLocationId }

  // Product filter
  if (params.productId) {
    where.productId = params.productId
  }

  // Low stock filter (stock < threshold)
  if (params.lowStock === 'true' || params.lowStock === true) {
    const threshold = params.lowStockThreshold ? parseInt(params.lowStockThreshold) : 10
    where.stock = { lt: threshold }
  }

  // Pagination
  const page = params.page ? parseInt(params.page) : 1
  const limit = params.limit ? parseInt(params.limit) : 50
  const skip = (page - 1) * limit

  const [stocks, total] = await Promise.all([
    db.productSalesLocation.findMany({
      where,
      skip,
      take: limit,
      include: {
        product: {
          include: {
            category: true,
          },
        },
        salesLocation: true,
      },
      orderBy: { stock: 'asc' }, // Low stock first
    }),
    db.productSalesLocation.count({ where }),
  ])

  return {
    stocks,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Update stock for a product in a sales location
 * SalesLocation = สถานที่ขายและเก็บสินค้า (มี stock)
 * Sync กับ Product.stock
 */
export const updateStock = async (salesLocationId, productId, quantity, action = 'SET') => {
  const salesLocation = await db.salesLocation.findUnique({
    where: { id: salesLocationId },
  })

  if (!salesLocation) {
    throw new Error('Sales location not found')
  }

  const product = await db.product.findUnique({
    where: { id: productId },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  // Check if stock record exists
  const existing = await db.productSalesLocation.findUnique({
    where: {
      productId_salesLocationId: {
        productId,
        salesLocationId,
      },
    },
  })

  // Get total sales location stock for this product (sum of all sales locations)
  const allSalesLocationStocks = await db.productSalesLocation.findMany({
    where: { productId },
    select: { stock: true },
  })
  const totalSalesLocationStock = allSalesLocationStocks.reduce((sum, psl) => sum + psl.stock, 0)

  let newStock
  let stockChange = 0 // Change in sales location stock

  if (existing) {
    // Update existing stock
    const oldStock = existing.stock
    if (action === 'ADD') {
      newStock = existing.stock + quantity
      stockChange = quantity
    } else if (action === 'SUBTRACT') {
      const actualSubtract = Math.min(quantity, existing.stock) // Can't subtract more than available
      newStock = Math.max(0, existing.stock - quantity)
      stockChange = -actualSubtract // Negative change (returning to product.stock)
    } else {
      // SET
      newStock = Math.max(0, quantity)
      stockChange = newStock - oldStock
    }
  } else {
    // Create new stock record
    if (action === 'ADD') {
      newStock = quantity
      stockChange = quantity
    } else if (action === 'SUBTRACT') {
      newStock = 0
      stockChange = 0
    } else {
      // SET
      newStock = Math.max(0, quantity)
      stockChange = quantity
    }
  }

  // Calculate new total sales location stock
  const newTotalSalesLocationStock = totalSalesLocationStock - (existing?.stock || 0) + newStock

  // Validate: Total sales location stock cannot exceed product.stock
  if (newTotalSalesLocationStock > product.stock) {
    throw new Error(
      `Cannot add stock: Total sales location stock (${newTotalSalesLocationStock}) would exceed product stock (${product.stock})`
    )
  }

  // Update sales location stock and sync with product stock
  const result = await db.$transaction(async (tx) => {
    // Update or create ProductSalesLocation
    let productSalesLocation
    if (existing) {
      productSalesLocation = await tx.productSalesLocation.update({
        where: {
          productId_salesLocationId: {
            productId,
            salesLocationId,
          },
        },
        data: { stock: newStock },
      })
    } else {
      productSalesLocation = await tx.productSalesLocation.create({
        data: {
          productId,
          salesLocationId,
          stock: newStock,
          isAvailable: true,
        },
      })
    }

    // Sync with product.stock: adjust product stock based on sales location stock change
    // When adding to sales location: decrease product.stock
    // When removing from sales location: increase product.stock
    if (stockChange !== 0) {
      if (stockChange > 0) {
        // Adding stock to sales location → decrease product.stock
        await tx.product.update({
          where: { id: productId },
          data: {
            stock: {
              decrement: stockChange,
            },
          },
        })
      } else {
        // Removing stock from sales location → increase product.stock
        await tx.product.update({
          where: { id: productId },
          data: {
            stock: {
              increment: Math.abs(stockChange),
            },
          },
        })
      }
    }

    return productSalesLocation
  })

  return result
}

/**
 * Transfer stock between sales locations
 * SalesLocation = สถานที่ขายและเก็บสินค้า (มี stock)
 */
export const transferStock = async (fromSalesLocationId, toSalesLocationId, productId, quantity) => {
  if (fromSalesLocationId === toSalesLocationId) {
    throw new Error('Cannot transfer to the same sales location')
  }

  // Check source sales location stock
  const sourceStock = await db.productSalesLocation.findUnique({
    where: {
      productId_salesLocationId: {
        productId,
        salesLocationId: fromSalesLocationId,
      },
    },
  })

  if (!sourceStock || sourceStock.stock < quantity) {
    throw new Error('Insufficient stock in source sales location')
  }

  // Transfer: Use transaction to ensure atomicity
  // Note: Transfer doesn't change total sales location stock, so no need to update product.stock
  await db.$transaction(async (tx) => {
    // Subtract from source
    await tx.productSalesLocation.update({
      where: {
        productId_salesLocationId: {
          productId,
          salesLocationId: fromSalesLocationId,
        },
      },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    })

    // Add to destination (create if doesn't exist)
    const destStock = await tx.productSalesLocation.findUnique({
      where: {
        productId_salesLocationId: {
          productId,
          salesLocationId: toSalesLocationId,
        },
      },
    })

    if (destStock) {
      await tx.productSalesLocation.update({
        where: {
          productId_salesLocationId: {
            productId,
            salesLocationId: toSalesLocationId,
          },
        },
        data: {
          stock: {
            increment: quantity,
          },
        },
      })
    } else {
      await tx.productSalesLocation.create({
        data: {
          productId,
          salesLocationId: toSalesLocationId,
          stock: quantity,
          isAvailable: true,
        },
      })
    }
  })

  return { message: 'Stock transferred successfully' }
}

/**
 * Add product to sales location
 * Product.stock = stock หลัก (global stock)
 * SalesLocation ดึง stock จาก Product.stock ไปใช้
 * เมื่อเพิ่ม stock ใน SalesLocation → Product.stock ต้องลดลง
 */
export const addProduct = async (salesLocationId, productId, isAvailable = true, stock = 0) => {
  const salesLocation = await db.salesLocation.findUnique({
    where: { id: salesLocationId },
  })

  if (!salesLocation) {
    throw new Error('Sales location not found')
  }

  const product = await db.product.findUnique({
    where: { id: productId },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  // Validate: Stock cannot exceed product.stock
  if (stock > product.stock) {
    throw new Error(
      `Cannot add stock: Requested stock (${stock}) exceeds product stock (${product.stock})`
    )
  }

  // Check if already exists
  const existing = await db.productSalesLocation.findUnique({
    where: {
      productId_salesLocationId: {
        productId,
        salesLocationId,
      },
    },
  })

  // Use transaction to ensure atomicity
  return await db.$transaction(async (tx) => {
    let productSalesLocation

    if (existing) {
      // Calculate stock change
      const oldStock = existing.stock || 0
      const stockChange = stock - oldStock

      // Validate: New total stock cannot exceed product.stock
      if (stockChange > 0 && stockChange > product.stock) {
        throw new Error(
          `Cannot add stock: Stock increase (${stockChange}) exceeds available product stock (${product.stock})`
        )
      }

      // Update existing
      productSalesLocation = await tx.productSalesLocation.update({
        where: {
          productId_salesLocationId: {
            productId,
            salesLocationId,
          },
        },
        data: { 
          isAvailable,
          stock,
        },
      })

      // Sync with Product.stock
      // When adding stock to SalesLocation → decrease Product.stock
      // When removing stock from SalesLocation → increase Product.stock
      if (stockChange > 0) {
        // Adding stock → decrease Product.stock
        await tx.product.update({
          where: { id: productId },
          data: {
            stock: {
              decrement: stockChange,
            },
          },
        })
      } else if (stockChange < 0) {
        // Removing stock → increase Product.stock
        await tx.product.update({
          where: { id: productId },
          data: {
            stock: {
              increment: Math.abs(stockChange),
            },
          },
        })
      }
    } else {
      // Create new
      productSalesLocation = await tx.productSalesLocation.create({
        data: {
          productId,
          salesLocationId,
          isAvailable,
          stock,
        },
      })

      // When adding stock to SalesLocation → decrease Product.stock
      if (stock > 0) {
        await tx.product.update({
          where: { id: productId },
          data: {
            stock: {
              decrement: stock,
            },
          },
        })
      }
    }

    return productSalesLocation
  })
}

/**
 * Remove product from sales location
 * Product.stock = stock หลัก (global stock)
 * SalesLocation ดึง stock จาก Product.stock ไปใช้
 * เมื่อลบสินค้าออกจาก SalesLocation → Product.stock ต้องเพิ่มกลับ (คืน stock ที่ดึงไปใช้)
 */
export const removeProduct = async (salesLocationId, productId) => {
  // Get existing stock before deletion
  const existing = await db.productSalesLocation.findUnique({
    where: {
      productId_salesLocationId: {
        productId,
        salesLocationId,
      },
    },
  })

  // Use transaction to ensure atomicity
  return await db.$transaction(async (tx) => {
    // Delete ProductSalesLocation
    await tx.productSalesLocation.delete({
      where: {
        productId_salesLocationId: {
          productId,
          salesLocationId,
        },
      },
    })

    // Return stock to Product.stock (คืน stock ที่ดึงไปใช้)
    if (existing && existing.stock > 0) {
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: {
            increment: existing.stock,
          },
        },
      })
    }

    return { message: 'Product removed from sales location' }
  })
}
