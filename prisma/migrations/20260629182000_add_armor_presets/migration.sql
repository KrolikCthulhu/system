CREATE TABLE "armor_presets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "protection" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "armor_presets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "armor_presets_slug_key" ON "armor_presets"("slug");
CREATE UNIQUE INDEX "armor_presets_name_key" ON "armor_presets"("name");
CREATE INDEX "armor_presets_is_active_sort_order_idx" ON "armor_presets"("is_active", "sort_order");
