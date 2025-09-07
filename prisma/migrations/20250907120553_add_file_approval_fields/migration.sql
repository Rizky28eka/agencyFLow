/*
  Warnings:

  - You are about to drop the `task_comments` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."CommentEntityType" AS ENUM ('TASK', 'PROJECT', 'INVOICE', 'CLIENT', 'FILE');

-- CreateEnum
CREATE TYPE "public"."FileApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REVISION_NEEDED');

-- DropForeignKey
ALTER TABLE "public"."task_comments" DROP CONSTRAINT "task_comments_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."task_comments" DROP CONSTRAINT "task_comments_taskId_fkey";

-- DropTable
DROP TABLE "public"."task_comments";

-- CreateTable
CREATE TABLE "public"."comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "entityType" "public"."CommentEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comments_entityId_entityType_idx" ON "public"."comments"("entityId", "entityType");

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
