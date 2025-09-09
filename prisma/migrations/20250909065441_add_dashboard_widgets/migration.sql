-- CreateTable
CREATE TABLE "public"."dashboard_widgets" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "layoutId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dashboard_widgets_layoutId_idx" ON "public"."dashboard_widgets"("layoutId");

-- AddForeignKey
ALTER TABLE "public"."dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_layoutId_fkey" FOREIGN KEY ("layoutId") REFERENCES "public"."dashboard_layouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
