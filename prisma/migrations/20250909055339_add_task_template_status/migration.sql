-- AlterTable
ALTER TABLE "public"."task_templates" ADD COLUMN     "status" "public"."TaskStatus" NOT NULL DEFAULT 'TO_DO';
