import { db } from '../utils/db.js'
import { uploadBase64Image } from '../utils/cloudinary.js'

export const getAll = async (params = {}) => {
  const where = {}
  
  // Status filter
  if (params.status) {
    where.status = params.status
  }
  // If no status filter, show all products (for admin page)

  // Category filter
  if (params.category) {
    where.categoryId = params.category
  }

  // Search by name
  if (params.search) {
    where.name = {
      contains: params.search,
      mode: 'insensitive',
    }
  }

  // Price range filter
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    where.price = {}
    if (params.minPrice !== undefined) {
      where.price.gte = Number(params.minPrice)
    }
    if (params.maxPrice !== undefined) {
      where.price.lte = Number(params.maxPrice)
    }
  }

  // Sorting
  let orderBy = { createdAt: 'desc' } // Default: newest first
  
  if (params.sortBy) {
    const order = params.order === 'asc' ? 'asc' : 'desc'
    
    switch (params.sortBy) {
      case 'price':
        orderBy = { price: order }
        break
      case 'name':
        orderBy = { name: order }
        break
      case 'createdAt':
        orderBy = { createdAt: order }
        break
      default:
        orderBy = { createdAt: 'desc' }
    }
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
        salesLocations: {
          include: {
            salesLocation: {
              select: {
                id: true,
                name: true,
                province: true,
                district: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy,
      skip,
      take: params.limit || 20,
    }),
    db.product.count({ where }),
  ])

  // เพิ่มข้อมูลสต็อกตามสถานที่ขายให้กับแต่ละ product
  const productsWithStockInfo = products.map(product => {
    try {
      // ตรวจสอบว่ามี salesLocations หรือไม่
      const salesLocations = Array.isArray(product.salesLocations) ? product.salesLocations : []
      
      // คำนวณสต็อกทั้งหมดจากทุกสถานที่ขาย (กรองเฉพาะที่มี salesLocation และ status Active)
      const totalAvailableStock = salesLocations
        .filter(psl => 
          psl &&
          psl.isAvailable && 
          psl.salesLocation && 
          psl.salesLocation.status === 'Active'
        )
        .reduce((sum, psl) => sum + (psl.stock || 0), 0)

      // หาสถานที่ที่ยังมีสต็อก
      const availableLocations = salesLocations
        .filter(psl => 
          psl &&
          psl.isAvailable && 
          psl.salesLocation && 
          psl.salesLocation.status === 'Active' && 
          (psl.stock || 0) > 0
        )
        .map(psl => ({
          id: psl.salesLocation.id,
          name: psl.salesLocation.name || 'ไม่ระบุ',
          province: psl.salesLocation.province || '',
          district: psl.salesLocation.district || '',
          stock: psl.stock || 0,
        }))

      return {
        ...product,
        // ใช้ totalAvailableStock แทน product.stock สำหรับการแสดงผล
        availableStock: totalAvailableStock,
        availableLocations,
        // เก็บ salesLocations สำหรับข้อมูลเพิ่มเติม (กรองเฉพาะที่มี salesLocation)
        salesLocations: salesLocations
          .filter(psl => psl && psl.salesLocation !== null)
          .map(psl => ({
            id: psl.id,
            stock: psl.stock || 0,
            isAvailable: psl.isAvailable,
            salesLocation: psl.salesLocation,
          })),
      }
    } catch (error) {
      // ถ้าเกิดข้อผิดพลาดในการประมวลผล ให้ส่งคืน product เดิมพร้อมค่า default
      console.error('Error processing product stock info:', error, product.id)
      return {
        ...product,
        availableStock: product.stock || 0,
        availableLocations: [],
        salesLocations: [],
      }
    }
  })

  return {
    products: productsWithStockInfo,
    total,
    page: params.page || 1,
    limit: params.limit || 20,
    totalPages: Math.ceil(total / (params.limit || 20)),
  }
}

export const getById = async (id) => {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: true,
      salesLocations: {
        include: {
          salesLocation: {
            select: {
              id: true,
              name: true,
              province: true,
              district: true,
              status: true,
            },
          },
        },
      },
    },
  })

  if (!product) {
    return null
  }

  try {
    // ตรวจสอบว่ามี salesLocations หรือไม่
    const salesLocations = Array.isArray(product.salesLocations) ? product.salesLocations : []

    // คำนวณสต็อกทั้งหมดจากทุกสถานที่ขาย (กรองเฉพาะที่มี salesLocation และ status Active)
    const totalAvailableStock = salesLocations
      .filter(psl => 
        psl &&
        psl.isAvailable && 
        psl.salesLocation && 
        psl.salesLocation.status === 'Active'
      )
      .reduce((sum, psl) => sum + (psl.stock || 0), 0)

    // หาสถานที่ที่ยังมีสต็อก
    const availableLocations = salesLocations
      .filter(psl => 
        psl &&
        psl.isAvailable && 
        psl.salesLocation && 
        psl.salesLocation.status === 'Active' && 
        (psl.stock || 0) > 0
      )
      .map(psl => ({
        id: psl.salesLocation.id,
        name: psl.salesLocation.name || 'ไม่ระบุ',
        province: psl.salesLocation.province || '',
        district: psl.salesLocation.district || '',
        stock: psl.stock || 0,
      }))

    return {
      ...product,
      availableStock: totalAvailableStock,
      availableLocations,
      // เก็บ salesLocations สำหรับข้อมูลเพิ่มเติม (กรองเฉพาะที่มี salesLocation)
      salesLocations: salesLocations
        .filter(psl => psl && psl.salesLocation !== null)
        .map(psl => ({
          id: psl.id,
          stock: psl.stock || 0,
          isAvailable: psl.isAvailable,
          salesLocation: psl.salesLocation,
        })),
    }
  } catch (error) {
    // ถ้าเกิดข้อผิดพลาดในการประมวลผล ให้ส่งคืน product เดิมพร้อมค่า default
    console.error('Error processing product stock info:', error, product.id)
    return {
      ...product,
      availableStock: product.stock || 0,
      availableLocations: [],
      salesLocations: [],
    }
  }
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
      status: data.status || 'Active',
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
  if (data.stock !== undefined) updateData.stock = data.stock // Product.stock = stock หลัก
  if (data.status !== undefined) updateData.status = data.status
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
  // Check if product exists
  const product = await db.product.findUnique({
    where: { id },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  // Delete product directly
  // - ProductSalesLocation will be deleted via cascade (onDelete: Cascade)
  // - CartItems will be deleted via cascade (onDelete: Cascade)
  // - OrderItems.productId will be set to null (onDelete: SetNull) to preserve order history
  return await db.product.delete({
    where: { id },
  })
}

export const uploadImage = async (id, imageData) => {
  let imageUrl = imageData;
  
  // If it's a base64 string, upload to Cloudinary
  if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
    try {
      imageUrl = await uploadBase64Image(imageData, 'products');
      console.log('Product image uploaded to Cloudinary:', imageUrl);
    } catch (error) {
      console.error('Failed to upload product image to Cloudinary:', error);
      throw new Error('Failed to upload product image');
    }
  }
  
  return await db.product.update({
    where: { id },
    data: { imageUrl },
  })
}
