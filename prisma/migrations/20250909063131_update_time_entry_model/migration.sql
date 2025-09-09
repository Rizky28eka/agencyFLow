/*
  Warnings:

  - You are about to drop the column `createdAt` on the `time_entries` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `time_entries` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `time_entries` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `time_entries` table. All the data in the column will be lost.
  - You are about to drop the column `hourlyRate` on the `time_entries` table. All the data in the column will be lost.
  - You are about to drop the column `hours` on the `time_entries` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `time_entries` table. All the data in the column will be lost.
  - Added the required column `seconds` to the `time_entries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startAt` to the `time_entries` table without a default value. This is not possible if the table is not empty.
  - Made the column `taskId` on table `time_entries` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."time_entries" DROP CONSTRAINT "time_entries_taskId_fkey";

-- DropIndex
DROP INDEX "public"."time_entries_projectId_date_idx";

-- DropIndex
DROP INDEX "public"."time_entries_userId_date_idx";

-- AlterTable
ALTER TABLE "public"."time_entries" DROP COLUMN "createdAt",
DROP COLUMN "currency",
DROP COLUMN "date",
DROP COLUMN "deletedAt",
DROP COLUMN "hourlyRate",
DROP COLUMN "hours",
DROP COLUMN "updatedAt",
ADD COLUMN     "endAt" TIMESTAMP(3),
ADD COLUMN     "seconds" INTEGER NOT NULL,
ADD COLUMN     "startAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "taskId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "time_entries_projectId_startAt_idx" ON "public"."time_entries"("projectId", "startAt");

-- CreateIndex
CREATE INDEX "time_entries_userId_startAt_idx" ON "public"."time_entries"("userId", "startAt");

-- AddForeignKey
ALTER TABLE "public"."time_entries" ADD CONSTRAINT "time_entries_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
