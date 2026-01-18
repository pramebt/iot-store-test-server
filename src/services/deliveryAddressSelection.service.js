import { db } from '../utils/db.js'

/**
 * Select the best delivery address and sales location for shipping
 * Returns: { deliveryAddress, salesLocation }
 * 
 * DeliveryAddress = สถานที่ส่งสินค้า (ไม่มี stock)
 * SalesLocation = สถานที่ขายและเก็บสินค้า (มี stock)
 */
export const selectDeliveryAddressAndSalesLocation = async (orderItems, shippingProvince) => {
  // Get all active delivery addresses
  const deliveryAddresses = await db.deliveryAddress.findMany({
    where: { status: 'Active' },
  })

  if (deliveryAddresses.length === 0) {
    throw new Error('No active delivery addresses available')
  }

  // Find SalesLocation that has stock for all products
  // DeliveryAddress ไม่มี stock → ต้องหา SalesLocation ที่มี stock
  const salesLocations = await db.salesLocation.findMany({
    where: { status: 'Active' },
  })

  let selectedSalesLocation = null

  for (const salesLocation of salesLocations) {
    let hasAllStock = true
    const stockIssues = []

    for (const item of orderItems) {
      const productLocation = await db.productSalesLocation.findUnique({
        where: {
          productId_salesLocationId: {
            productId: item.productId,
            salesLocationId: salesLocation.id,
          },
        },
      })

      if (!productLocation) {
        hasAllStock = false
        stockIssues.push(`Product ${item.productId} not found in ${salesLocation.name}`)
        break
      }

      if (!productLocation.isAvailable) {
        hasAllStock = false
        stockIssues.push(`Product ${item.productId} not available in ${salesLocation.name}`)
        break
      }

      if (productLocation.stock < item.quantity) {
        hasAllStock = false
        stockIssues.push(`Product ${item.productId} has only ${productLocation.stock} stock (need ${item.quantity}) in ${salesLocation.name}`)
        break
      }
    }

    if (hasAllStock) {
      selectedSalesLocation = salesLocation
      break // Use first SalesLocation that has all stock
    }
  }

  if (!selectedSalesLocation) {
    console.error('No sales location has sufficient stock for all products')
    throw new Error('No sales location has sufficient stock for all products. Please check product availability.')
  }

  // Select delivery address nearest to shipping province (for shipping)
  // DeliveryAddress = สถานที่ส่งสินค้า (ไม่เก็บ stock)
  const sameProvinceDeliveryAddresses = deliveryAddresses.filter(
    (da) => da.province === shippingProvince
  )

  let selectedDeliveryAddress
  if (sameProvinceDeliveryAddresses.length > 0) {
    // Prefer delivery address in same province
    selectedDeliveryAddress = sameProvinceDeliveryAddresses[0]
  } else {
    // If no delivery address in same province, return first available
    // (In future, can implement distance calculation)
    selectedDeliveryAddress = deliveryAddresses[0]
  }

  return {
    deliveryAddress: selectedDeliveryAddress,
    salesLocation: selectedSalesLocation,
  }
}

/**
 * Calculate shipping fee based on delivery address and shipping address
 * Simple implementation: based on province matching
 * (Can be enhanced with distance calculation using Google Maps API)
 */
export const calculateShippingFee = (deliveryAddress, shippingProvince) => {
  // Same province: 50 THB
  if (deliveryAddress.province === shippingProvince) {
    return 50
  }

  // Different province: 150 THB
  return 150

  // Future enhancement: Calculate actual distance
  // const distance = await calculateDistance(deliveryAddress.address, shippingAddress)
  // if (distance < 50) return 50
  // if (distance < 100) return 80
  // if (distance < 200) return 120
  // return 150
}

/**
 * Check product availability in SalesLocations
 * DeliveryAddress = สถานที่ส่งสินค้า (ไม่มี stock) → ไม่ต้องเช็ค
 */
export const checkProductAvailability = async (productId, province) => {
  const product = await db.product.findUnique({
    where: { id: productId },
  })

  if (!product) {
    throw new Error('Product not found')
  }

  // Get all SalesLocations with stock for this product
  // DeliveryAddress ไม่มี stock → เช็คจาก SalesLocation เท่านั้น
  const salesLocationProducts = await db.productSalesLocation.findMany({
    where: {
      productId,
      isAvailable: true,
      stock: { gt: 0 },
    },
    include: {
      salesLocation: {
        where: { status: 'Active' },
      },
    },
  })

  const availableSalesLocations = salesLocationProducts
    .filter((psl) => psl.salesLocation)
    .map((psl) => ({
      id: psl.salesLocation.id,
      name: psl.salesLocation.name,
      code: psl.salesLocation.code,
      province: psl.salesLocation.province,
      stock: psl.stock,
      isSameProvince: psl.salesLocation.province === province,
      estimatedShipping: psl.salesLocation.province === province ? '1-2 วัน' : '3-5 วัน',
    }))

  // Sort: same province first, then by stock
  availableSalesLocations.sort((a, b) => {
    if (a.isSameProvince && !b.isSameProvince) return -1
    if (!a.isSameProvince && b.isSameProvince) return 1
    return b.stock - a.stock
  })

  return {
    available: availableSalesLocations.length > 0,
    salesLocations: availableSalesLocations, // Return SalesLocations, not delivery addresses
    estimatedShipping: availableSalesLocations.length > 0
      ? availableSalesLocations[0].estimatedShipping
      : 'ไม่พร้อมส่ง',
  }
}
