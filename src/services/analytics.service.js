import { db } from '../utils/db.js'

export const getSalesByProvince = async () => {
  const orders = await db.order.findMany({
    where: {
      status: { in: ['PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED'] },
      province: { not: null },
    },
      select: {
        province: true,
        totalAmount: true,
        id: true,
      },
    })

    const provinceData = orders.reduce((acc, order) => {
      if (!order.province) return acc

      if (!acc[order.province]) {
        acc[order.province] = {
          province: order.province,
          totalSales: 0,
          ordersCount: 0,
        }
      }

      acc[order.province].totalSales += order.totalAmount
      acc[order.province].ordersCount += 1

      return acc
    }, {})

    return Object.values(provinceData).sort((a, b) => b.totalSales - a.totalSales)
}

export const getSalesHistory = async (months = 12) => {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const orders = await db.order.findMany({
      where: {
        status: { in: ['PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED'] },
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    })

    const monthlyData = orders.reduce((acc, order) => {
      const month = new Date(order.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
      })

      if (!acc[month]) {
        acc[month] = { month, totalSales: 0, ordersCount: 0 }
      }

      acc[month].totalSales += order.totalAmount
      acc[month].ordersCount += 1

      return acc
    }, {})

    return Object.values(monthlyData).sort(
      (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
    )
}

export const getTopProvinces = async (limit = 10) => {
  const salesByProvince = await getSalesByProvince()
  return salesByProvince.slice(0, limit)
}

export const getTopProducts = async (limit = 10) => {
    // Get order items with non-null productId
    const orderItems = await db.orderItem.findMany({
      where: {
        productId: { not: null },
      },
      select: {
        productId: true,
        quantity: true,
      },
    })

    // Group by productId manually
    const productStats = orderItems.reduce((acc, item) => {
      if (!item.productId) return acc
      
      if (!acc[item.productId]) {
        acc[item.productId] = {
          productId: item.productId,
          totalSold: 0,
          orderCount: 0,
        }
      }
      
      acc[item.productId].totalSold += item.quantity
      acc[item.productId].orderCount += 1
      
      return acc
    }, {})

    // Sort by totalSold and take top N
    const topProductStats = Object.values(productStats)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit)

    // Fetch product details
    const products = await Promise.all(
      topProductStats.map(async (item) => {
        const product = await db.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
          },
        })
        
        // If product was deleted, return null (will be filtered out)
        if (!product) return null
        
        return {
          ...product,
          totalSold: item.totalSold,
          orderCount: item.orderCount,
        }
      })
    )

    // Filter out null products (deleted products)
    return products.filter(Boolean)
}

export const getSummary = async () => {
  try {
    const [salesByProvince, salesHistory, topProvinces, topProducts] = await Promise.all([
      getSalesByProvince().catch(err => {
        console.error('Error in getSalesByProvince:', err)
        return []
      }),
      getSalesHistory(12).catch(err => {
        console.error('Error in getSalesHistory:', err)
        return []
      }),
      getTopProvinces(10).catch(err => {
        console.error('Error in getTopProvinces:', err)
        return []
      }),
      getTopProducts(10).catch(err => {
        console.error('Error in getTopProducts:', err)
        return []
      }),
    ])

    const totalSales = salesByProvince.reduce((sum, item) => sum + item.totalSales, 0)
    const totalOrders = salesByProvince.reduce((sum, item) => sum + item.ordersCount, 0)
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

    // Get total customers
    const totalCustomers = await db.user.count({
      where: { role: 'CUSTOMER' },
    })

    // Get total products sold
    const totalProductsSold = await db.orderItem.aggregate({
      _sum: {
        quantity: true,
      },
    })

    // Get active provinces count
    const activeProvinces = new Set(
      salesByProvince.map(item => item.province).filter(Boolean)
    ).size

    return {
      totalRevenue: totalSales,
      totalOrders,
      totalCustomers,
      totalProductsSold: totalProductsSold._sum.quantity || 0,
      averageOrderValue,
      activeProvinces,
      // Growth percentages (mock data for now - can calculate from historical data)
      revenueGrowth: 12.5,
      ordersGrowth: 8.3,
      customersGrowth: 15.2,
      productsSoldGrowth: 10.1,
      aovGrowth: 5.4,
      provincesGrowth: 3.2,
      // Additional data
      salesByProvince,
      salesHistory,
      topProvinces,
      topProducts,
    }
  } catch (error) {
    console.error('Error in getSummary:', error)
    throw error
  }
}
