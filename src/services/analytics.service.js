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
    const orderItems = await db.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
      },
      _count: {
        productId: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    })

    const products = await Promise.all(
      orderItems.map(async (item) => {
        const product = await db.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
          },
        })
        return {
          ...product,
          totalSold: item._sum.quantity,
          orderCount: item._count.productId,
        }
      })
    )

    return products
}

export const getSummary = async () => {
  const [salesByProvince, salesHistory, topProvinces, topProducts] = await Promise.all([
    getSalesByProvince(),
    getSalesHistory(12),
    getTopProvinces(10),
    getTopProducts(10),
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
}
