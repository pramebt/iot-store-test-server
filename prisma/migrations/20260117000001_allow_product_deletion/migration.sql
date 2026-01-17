-- Make productId nullable in order_items and set onDelete to SET NULL
ALTER TABLE "order_items" ALTER COLUMN "productId" DROP NOT NULL;

-- Drop existing foreign key constraint
ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_productId_fkey";

-- Add new foreign key constraint with SET NULL on delete
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" 
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Change cart_items foreign key to CASCADE on delete
ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS "cart_items_productId_fkey";

ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_productId_fkey" 
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
