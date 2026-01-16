-- AlterEnum: Update OrderStatus enum values from PascalCase to UPPERCASE
-- Create new enum type with UPPERCASE values
CREATE TYPE "OrderStatus_new" AS ENUM ('PENDING', 'PAID', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- Update the orders table to use new enum
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;

-- Convert existing values: Pending->PENDING, Paid->PAID, Confirmed->CONFIRMED, Shipping->SHIPPED, Delivered->DELIVERED, Cancelled->CANCELLED
ALTER TABLE "orders" 
  ALTER COLUMN "status" TYPE "OrderStatus_new" 
  USING (
    CASE status::text
      WHEN 'Pending' THEN 'PENDING'
      WHEN 'Paid' THEN 'PAID'
      WHEN 'Confirmed' THEN 'CONFIRMED'
      WHEN 'Shipping' THEN 'SHIPPED'
      WHEN 'Delivered' THEN 'DELIVERED'
      WHEN 'Cancelled' THEN 'CANCELLED'
      ELSE 'PENDING'
    END::"OrderStatus_new"
  );

-- Set new default
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"OrderStatus_new";

-- Drop old enum and rename new one
DROP TYPE "OrderStatus";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
