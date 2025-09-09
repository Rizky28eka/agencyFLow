/*
  Warnings:

  - You are about to drop the column `dependencies` on the `task_templates` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `task_templates` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `time_entries` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `time_entries` table. All the data in the column will be lost.
  - You are about to drop the `automation_actions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `automation_rules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `automation_triggers` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `hours` on table `time_entries` required. This step will fail if there are existing NULL values in that column.
  - Made the column `date` on table `time_entries` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."automation_actions" DROP CONSTRAINT "automation_actions_ruleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."automation_rules" DROP CONSTRAINT "automation_rules_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."automation_rules" DROP CONSTRAINT "automation_rules_triggerId_fkey";

-- AlterTable
ALTER TABLE "public"."task_templates" DROP COLUMN "dependencies",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "public"."time_entries" DROP COLUMN "endTime",
DROP COLUMN "startTime",
ALTER COLUMN "hours" SET NOT NULL,
ALTER COLUMN "date" SET NOT NULL;

-- DropTable
DROP TABLE "public"."automation_actions";

-- DropTable
DROP TABLE "public"."automation_rules";

-- DropTable
DROP TABLE "public"."automation_triggers";

-- DropEnum
DROP TYPE "public"."ActionType";

-- DropEnum
DROP TYPE "public"."TriggerType";

-- CreateTable
CREATE TABLE "public"."AutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "conditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AutomationAction" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationAction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."AutomationRule" ADD CONSTRAINT "AutomationRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AutomationAction" ADD CONSTRAINT "AutomationAction_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "public"."AutomationRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
