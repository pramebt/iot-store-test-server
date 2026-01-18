import { db } from '../utils/db.js'
import { uploadBase64Image } from '../utils/cloudinary.js'
import { selectDeliveryAddressAndSalesLocation, calculateShippingFee } from './deliveryAddressSelection.service.js'

export const getAll = async (params = {}) => {
    const where = {}

    if (params.status) {
      where.status = params.status
    }

    if (params.customerId) {
      where.customerId = params.customerId
    }

    if (params.deliveryAddressId) {
      where.deliveryAddressId = params.deliveryAddressId
    }

    if (params.salesLocationId) {
      where.salesLocationId = params.salesLocationId
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
          salesLocation: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          deliveryAddress: {
            select: {
              id: true,
              name: true,
              code: true,
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
    const order = await db.order.findUnique({
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
          salesLocation: true,
          deliveryAddress: true, // Include delivery address relation
          items: {
            include: {
              product: true, // product can be null if deleted
            },
          },
        },
    })

    // If deliveryAddressId exists but deliveryAddress is null, try to fetch it manually
    // (This can happen if delivery address was deleted or relation is broken)
    if (order && order.deliveryAddressId && !order.deliveryAddress) {
      try {
        const deliveryAddress = await db.deliveryAddress.findUnique({
          where: { id: order.deliveryAddressId },
        })
        if (deliveryAddress) {
          order.deliveryAddress = deliveryAddress
        }
      } catch (error) {
        console.error('Error fetching delivery address:', error)
        // Keep deliveryAddress as null if fetch fails
      }
    }

    return order
}

export const create = async (customerId, data) => {
    // Generate order number
    const orderCount = await db.order.count()
    const orderNumber = `ORD${String(orderCount + 1).padStart(6, '0')}`

    // Calculate total
    let totalAmount = 0
    const orderItems = []
    let selectedDeliveryAddress = null
    let shippingFee = data.shippingFee || 0

    // Check if this is an in-store purchase (has salesLocationId)
    if (data.salesLocationId) {
      // In-store purchase: validate sales location
      const salesLocation = await db.salesLocation.findUnique({
        where: { id: data.salesLocationId },
      })

      if (!salesLocation) {
        throw new Error('Sales location not found')
      }

      if (salesLocation.status !== 'Active') {
        throw new Error('Sales location is not active')
      }

      // Check product availability and stock at sales location
      // SalesLocation = สถานที่ขายและเก็บสินค้า (มี stock)
      for (const item of data.items) {
        const productLocation = await db.productSalesLocation.findUnique({
          where: {
            productId_salesLocationId: {
              productId: item.productId,
              salesLocationId: data.salesLocationId,
            },
          },
        })

        if (!productLocation || !productLocation.isAvailable) {
          throw new Error(`Product not available at this sales location`)
        }

        // ตรวจสอบ stock ใน SalesLocation
        if (productLocation.stock < item.quantity) {
          throw new Error(`Insufficient stock at sales location for ${item.productId}`)
        }
      }
    } else {
      // Online purchase: find SalesLocation with stock, then select delivery address for shipping
      // DeliveryAddress = สถานที่ส่งสินค้า (ไม่มี stock)
      // SalesLocation = สถานที่ขายและเก็บสินค้า (มี stock)
      if (!data.province) {
        throw new Error('Province is required for online orders')
      }

      // Find SalesLocation that has stock and select delivery address for shipping
      const { deliveryAddress, salesLocation } = await selectDeliveryAddressAndSalesLocation(data.items, data.province)
      selectedDeliveryAddress = deliveryAddress
      const selectedSalesLocation = salesLocation

      // Calculate shipping fee
      shippingFee = calculateShippingFee(selectedDeliveryAddress, data.province)

      // Check stock in SalesLocation (not delivery address)
      for (const item of data.items) {
        const productLocation = await db.productSalesLocation.findUnique({
          where: {
            productId_salesLocationId: {
              productId: item.productId,
              salesLocationId: selectedSalesLocation.id,
            },
          },
        })

        if (!productLocation || !productLocation.isAvailable || productLocation.stock < item.quantity) {
          throw new Error(`Insufficient stock at sales location for ${item.productId}`)
        }
      }

      // Store salesLocationId for stock deduction
      data.salesLocationId = selectedSalesLocation.id
    }

    // Validate products and calculate total
    for (const item of data.items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }

      if (product.status !== 'Active') {
        throw new Error(`Product ${product.name} is not active`)
      }

      const itemTotal = product.price * item.quantity
      totalAmount += itemTotal

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      })
    }

    totalAmount += shippingFee

    // Create order
    const order = await db.order.create({
      data: {
        orderNumber,
        customerId,
        totalAmount,
        address: data.address,
        phone: data.phone,
        note: data.note,
        shippingFee,
        province: data.province,
        district: data.district,
        postalCode: data.postalCode,
        salesLocationId: data.salesLocationId || null, // SalesLocation ที่มี stock (สำหรับลด stock)
        deliveryAddressId: selectedDeliveryAddress ? selectedDeliveryAddress.id : null, // DeliveryAddress สำหรับส่งสินค้า
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
        salesLocation: true,
        deliveryAddress: true,
      },
    })

    // Update stock
    // DeliveryAddress = สถานที่ส่งสินค้า (ไม่มี stock) → ลด stock จาก SalesLocation เท่านั้น
    if (data.salesLocationId) {
      // SalesLocation = สถานที่ขายและเก็บสินค้า → ลด stock จาก SalesLocation
      for (const item of data.items) {
        await db.productSalesLocation.update({
          where: {
            productId_salesLocationId: {
              productId: item.productId,
              salesLocationId: data.salesLocationId,
            },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
        // Also decrement global product stock
        await db.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
      }
    }
    // ไม่มี else case เพราะ DeliveryAddress ไม่มี stock

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

    // Restore stock based on order type
    if (order.salesLocationId) {
      // In-store or Online: restore stock from SalesLocation
      for (const item of order.items) {
        await db.productSalesLocation.update({
          where: {
            productId_salesLocationId: {
              productId: item.productId,
              salesLocationId: order.salesLocationId,
            },
          },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
        // Also restore global product stock
        await db.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      }
    }

  return await db.order.update({
    where: { id },
    data: { status: 'CANCELLED' },
  })
}

export const assignDeliveryAddress = async (id, deliveryAddressId) => {
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  if (order.status !== 'CONFIRMED') {
    throw new Error('Can only assign delivery address to confirmed orders')
  }

  const deliveryAddress = await db.deliveryAddress.findUnique({
    where: { id: deliveryAddressId },
  })

  if (!deliveryAddress) {
    throw new Error('Delivery address not found')
  }

  // DeliveryAddress ไม่มี stock → ไม่ต้องเช็ค stock
  // Stock มาจาก SalesLocation เท่านั้น

  return await db.order.update({
    where: { id },
    data: { deliveryAddressId },
  })
}
