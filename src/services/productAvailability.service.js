import { db } from '../utils/db.js'

/**
 * Get all available locations (SalesLocation only) for a product
 * Returns locations where product is available
 * 
 * DeliveryAddress = สถานที่ส่งสินค้า (ไม่มี stock) → ไม่แสดงในรายการ
 * SalesLocation = สถานที่ขายและเก็บสินค้า (มี stock) → แสดงในรายการ
 */
export const getProductAvailability = async (productId, customerProvince = null) => {
  try {
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
      },
    })

    if (!product) {
      throw new Error('Product not found')
    }

  // Get SalesLocations where product is available and has stock
  // SalesLocation = สถานที่ขายและเก็บสินค้า (มี stock)
  const salesLocationProducts = await db.productSalesLocation.findMany({
    where: {
      productId,
      isAvailable: true,
      stock: { gt: 0 }, // แสดงเฉพาะ SalesLocation ที่มี stock
    },
    include: {
      salesLocation: true, // Include all sales locations, filter later
    },
  })

    // Filter: only active sales locations
    const validSalesLocationProducts = salesLocationProducts.filter(
      psl => psl.salesLocation && psl.salesLocation.status === 'Active'
    )

  // DeliveryAddress = สถานที่ส่งสินค้า (ไม่มี stock) → ไม่ต้อง query

  // Format SalesLocations
  // SalesLocation = สถานที่ขายและเก็บสินค้า (มี stock)
  const availableSalesLocations = validSalesLocationProducts
    .map((psl) => {
      const location = psl.salesLocation
      const isSameProvince = customerProvince && location.province === customerProvince
      
      return {
        id: location.id,
        type: (location.locationType || 'STORE'),
        name: location.name || '',
        code: location.code || '',
        province: location.province || '',
        district: location.district || '',
        address: location.address || '',
        latitude: location.latitude ?? null,
        longitude: location.longitude ?? null,
        isAvailable: psl.isAvailable !== false,
        stock: psl.stock || 0, // สต็อกสินค้าในสาขานี้
        estimatedDelivery: isSameProvince ? '1-2 วัน' : '3-5 วัน',
        isSameProvince: !!isSameProvince,
      }
    })

  // DeliveryAddress = สถานที่ส่งสินค้า (ไม่มี stock) → ไม่แสดงในรายการ
  // แสดงเฉพาะ SalesLocation เท่านั้น

  // Combine all locations (only SalesLocations)
  const allLocations = [...availableSalesLocations]

  // Sort: same province first, then by name
  allLocations.sort((a, b) => {
    // Same province first
    if (a.isSameProvince && !b.isSameProvince) return -1
    if (!a.isSameProvince && b.isSameProvince) return 1
    
    // Then by name
    return a.name.localeCompare(b.name)
  })

    return {
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl,
        category: product.category,
      },
      availableLocations: allLocations,
      totalLocations: allLocations.length,
    }
  } catch (error) {
    console.error('Error in getProductAvailability:', error)
    throw error
  }
}
