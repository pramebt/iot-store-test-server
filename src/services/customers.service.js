import { db } from '../utils/db.js'

export const getAll = async (params = {}) => {
  const where = {}

  // Search by name or email
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } }
    ]
  }

  // Filter by province
  if (params.province) {
    where.province = params.province
  }

  // Only get customers (not admins)
  where.role = 'CUSTOMER'

  const skip = ((params.page || 1) - 1) * (params.limit || 10)

  const [customers, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        province: true,
        district: true,
        postalCode: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true
          }
        },
        orders: {
          select: {
            totalAmount: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: params.limit || 10,
    }),
    db.user.count({ where }),
  ])

  // Calculate total spent for each customer
  const customersWithStats = customers.map(customer => {
    const totalSpent = customer.orders.reduce((sum, order) => {
      // Only count completed/delivered orders
      if (['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
        return sum + order.totalAmount
      }
      return sum
    }, 0)

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      province: customer.province,
      district: customer.district,
      postalCode: customer.postalCode,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      _count: customer._count,
      totalSpent
    }
  })

  return {
    customers: customersWithStats,
    total,
    page: params.page || 1,
    limit: params.limit || 10,
    totalPages: Math.ceil(total / (params.limit || 10)),
  }
}

export const getStats = async () => {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [totalCustomers, newThisMonth, withOrders] = await Promise.all([
    // Total customers
    db.user.count({
      where: { role: 'CUSTOMER' }
    }),

    // New customers this month
    db.user.count({
      where: {
        role: 'CUSTOMER',
        createdAt: {
          gte: firstDayOfMonth
        }
      }
    }),

    // Customers with orders
    db.user.count({
      where: {
        role: 'CUSTOMER',
        orders: {
          some: {}
        }
      }
    })
  ])

  return {
    totalCustomers,
    activeCustomers: totalCustomers, // All customers are considered active
    newThisMonth,
    withOrders
  }
}

export const getById = async (id) => {
  const customer = await db.user.findUnique({
    where: { id, role: 'CUSTOMER' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      province: true,
      district: true,
      postalCode: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          orders: true
        }
      },
      orders: {
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          status: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!customer) {
    return null
  }

  // Calculate total spent
  const totalSpent = customer.orders.reduce((sum, order) => {
    if (['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)) {
      return sum + order.totalAmount
    }
    return sum
  }, 0)

  return {
    ...customer,
    totalSpent
  }
}
