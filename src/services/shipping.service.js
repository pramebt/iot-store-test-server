import { selectDeliveryAddressAndSalesLocation, calculateShippingFee, checkProductAvailability } from './deliveryAddressSelection.service.js'

/**
 * Calculate shipping information for checkout
 * Returns: deliveryAddress, salesLocation, shippingFee, estimatedShipping
 * 
 * DeliveryAddress = สถานที่ส่งสินค้า (ไม่มี stock)
 * SalesLocation = สถานที่ขายและเก็บสินค้า (มี stock)
 */
export const calculateShippingInfo = async (items, shippingProvince) => {
  console.log('calculateShippingInfo called with:', { items, shippingProvince })

  if (!shippingProvince) {
    throw new Error('Province is required')
  }

  if (!items || items.length === 0) {
    throw new Error('Items are required')
  }

  // Find SalesLocation with stock and select delivery address for shipping
  const { deliveryAddress, salesLocation } = await selectDeliveryAddressAndSalesLocation(items, shippingProvince)
  
  console.log('Selected delivery address:', deliveryAddress?.name)
  console.log('Selected sales location:', salesLocation?.name)

  // Calculate shipping fee
  const shippingFee = calculateShippingFee(deliveryAddress, shippingProvince)

  // Calculate estimated shipping time
  const estimatedShipping = deliveryAddress.province === shippingProvince ? '1-2 วัน' : '3-5 วัน'

  return {
    deliveryAddress: {
      id: deliveryAddress.id,
      name: deliveryAddress.name,
      code: deliveryAddress.code,
      province: deliveryAddress.province,
      district: deliveryAddress.district,
    },
    salesLocation: {
      id: salesLocation.id,
      name: salesLocation.name,
      code: salesLocation.code,
      province: salesLocation.province,
    },
    shippingFee,
    estimatedShipping,
  }
}

/**
 * Check product availability and get shipping info
 */
export const checkProductShipping = async (productId, province) => {
  const availability = await checkProductAvailability(productId, province)
  return availability
}
