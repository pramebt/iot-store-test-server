-- Rename warehouses table to delivery_addresses
ALTER TABLE "warehouses" RENAME TO "delivery_addresses";

-- Rename warehouseId to deliveryAddressId in orders table
ALTER TABLE "orders" RENAME COLUMN "warehouseId" TO "deliveryAddressId";

-- Drop foreign key constraint on orders.warehouseId (now deliveryAddressId)
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_warehouseId_fkey";

-- Add new foreign key constraint for deliveryAddressId
ALTER TABLE "orders" ADD CONSTRAINT "orders_deliveryAddressId_fkey" 
  FOREIGN KEY ("deliveryAddressId") REFERENCES "delivery_addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop product_warehouses table (no longer needed)
DROP TABLE IF EXISTS "product_warehouses";
