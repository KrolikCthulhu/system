CREATE TABLE "creature_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creature_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "creature_types_slug_key" ON "creature_types"("slug");

CREATE UNIQUE INDEX "creature_types_name_key" ON "creature_types"("name");

CREATE INDEX "creature_types_is_active_sort_order_idx" ON "creature_types"("is_active", "sort_order");
