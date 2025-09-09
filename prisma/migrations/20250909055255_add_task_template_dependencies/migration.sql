-- AlterTable
ALTER TABLE "public"."task_templates" ADD COLUMN     "dependencies" JSONB;

-- AlterTable
ALTER TABLE "public"."time_entries" ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "startTime" TIMESTAMP(3),
ALTER COLUMN "hours" DROP NOT NULL,
ALTER COLUMN "date" DROP NOT NULL;
