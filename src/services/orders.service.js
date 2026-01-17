import { db } from '../utils/db.js'
import { uploadBase64Image } from '../utils/cloudinary.js'

export const getAll = async (params = {}) => {
    const where = {}

    if (params.status) {
      where.status = params.status
    }

    if (params.customerId) {
      where.customerId = params.customerId
    }

    const skip = ((params.page || 1) - 1) * (params.limit || 20)

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: params.limit || 20,
      }),
      db.order.count({ where }),
    ])

    return {
      orders,
      total,
      page: params.page || 1,
      limit: params.limit || 20,
      totalPages: Math.ceil(total / (params.limit || 20)),
    }
}

export const getById = async (id) => {
    return await db.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    })
}

export const create = async (customerId, data) => {
    // Generate order number
    const orderCount = await db.order.count()
    const orderNumber = `ORD${String(orderCount + 1).padStart(6, '0')}`

    // Calculate total
    let totalAmount = 0
    const orderItems = []

    for (const item of data.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`)
      }

      const itemTotal = product.price * item.quantity
      totalAmount += itemTotal

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      })
    }

    totalAmount += data.shippingFee || 0

    // Create order
    const order = await db.order.create({
      data: {
        orderNumber,
        customerId,
        totalAmount,
        address: data.address,
        phone: data.phone,
        note: data.note,
        shippingFee: data.shippingFee || 0,
        province: data.province,
        district: data.district,
        postalCode: data.postalCode,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // Update product stock
    for (const item of data.items) {
      await db.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })
    }

    return order
}

export const updateStatus = async (id, status) => {
    return await db.order.update({
      where: { id },
      data: { status },
    })
}

export const addTracking = async (id, trackingNumber) => {
  return await db.order.update({
    where: { id },
    data: { 
      trackingNumber,
      status: 'SHIPPED',
    },
  })
}

export const uploadPayment = async (id, paymentImage) => {
  // Check if paymentImage is base64 or URL
  let imageUrl = paymentImage;
  
  // If it's a base64 string, upload to Cloudinary
  if (paymentImage.startsWith('data:image')) {
    try {
      imageUrl = await uploadBase64Image(paymentImage, 'payment-slips');
      console.log('Uploaded to Cloudinary:', imageUrl);
    } catch (error) {
      console.error('Failed to upload to Cloudinary:', error);
      throw new Error('Failed to upload payment image');
    }
  }
  
  return await db.order.update({
    where: { id },
    data: {
      paymentImage: imageUrl,
      paymentAt: new Date(),
      status: 'PAID',
    },
  })
}

export const cancel = async (id) => {
    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    })

  if (!order) {
    throw new Error('Order not found')
  }

  if (['SHIPPED', 'DELIVERED'].includes(order.status)) {
    throw new Error('Cannot cancel order in shipping or delivered status')
  }

    // Restore product stock
    for (const item of order.items) {
      await db.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      })
    }

  return await db.order.update({
    where: { id },
    data: { status: 'CANCELLED' },
  })
}
