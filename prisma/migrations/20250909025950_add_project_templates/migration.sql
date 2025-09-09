-- CreateTable
CREATE TABLE "public"."project_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "project_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."task_templates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "estimatedHours" DECIMAL(6,2),
    "sortIndex" INTEGER DEFAULT 0,
    "projectTemplateId" TEXT NOT NULL,

    CONSTRAINT "task_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_templates_organizationId_idx" ON "public"."project_templates"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "project_templates_organizationId_name_key" ON "public"."project_templates"("organizationId", "name");

-- CreateIndex
CREATE INDEX "task_templates_projectTemplateId_idx" ON "public"."task_templates"("projectTemplateId");

-- AddForeignKey
ALTER TABLE "public"."project_templates" ADD CONSTRAINT "project_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_templates" ADD CONSTRAINT "task_templates_projectTemplateId_fkey" FOREIGN KEY ("projectTemplateId") REFERENCES "public"."project_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
