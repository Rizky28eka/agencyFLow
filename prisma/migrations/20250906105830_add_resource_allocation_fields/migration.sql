-- AlterTable
ALTER TABLE "public"."tasks" ADD COLUMN     "estimatedHours" DECIMAL(6,2);

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "dailyCapacityHours" DECIMAL(4,2);
