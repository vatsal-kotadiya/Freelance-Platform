-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentStatus" ADD VALUE 'WORK_SUBMITTED';
ALTER TYPE "PaymentStatus" ADD VALUE 'WORK_REJECTED';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "deliveryFileName" TEXT,
ADD COLUMN     "deliveryFileUrl" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3);
