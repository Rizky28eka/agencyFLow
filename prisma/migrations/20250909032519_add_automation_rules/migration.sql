-- CreateEnum
CREATE TYPE "public"."TriggerType" AS ENUM ('TASK_STATUS_CHANGED');

-- CreateEnum
CREATE TYPE "public"."ActionType" AS ENUM ('CHANGE_TASK_STATUS', 'ASSIGN_USER', 'SEND_NOTIFICATION');

-- CreateTable
CREATE TABLE "public"."automation_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "triggerId" TEXT NOT NULL,

    CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."automation_triggers" (
    "id" TEXT NOT NULL,
    "type" "public"."TriggerType" NOT NULL,
    "config" JSONB NOT NULL,

    CONSTRAINT "automation_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."automation_actions" (
    "id" TEXT NOT NULL,
    "type" "public"."ActionType" NOT NULL,
    "config" JSONB NOT NULL,
    "ruleId" TEXT NOT NULL,

    CONSTRAINT "automation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "automation_rules_triggerId_key" ON "public"."automation_rules"("triggerId");

-- CreateIndex
CREATE INDEX "automation_rules_organizationId_isEnabled_idx" ON "public"."automation_rules"("organizationId", "isEnabled");

-- CreateIndex
CREATE INDEX "automation_actions_ruleId_idx" ON "public"."automation_actions"("ruleId");

-- AddForeignKey
ALTER TABLE "public"."automation_rules" ADD CONSTRAINT "automation_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."automation_rules" ADD CONSTRAINT "automation_rules_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "public"."automation_triggers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."automation_actions" ADD CONSTRAINT "automation_actions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "public"."automation_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
