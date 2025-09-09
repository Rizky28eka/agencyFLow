-- AlterTable
ALTER TABLE "public"."task_templates" ADD COLUMN     "assignedRole" TEXT,
ADD COLUMN     "stageIndex" INTEGER,
ADD COLUMN     "templateTaskId" TEXT;
