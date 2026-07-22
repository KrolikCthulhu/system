CREATE TABLE "creature_sizes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rank" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creature_sizes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "creature_sizes_slug_key" ON "creature_sizes"("slug");
CREATE UNIQUE INDEX "creature_sizes_name_key" ON "creature_sizes"("name");
CREATE UNIQUE INDEX "creature_sizes_rank_key" ON "creature_sizes"("rank");
CREATE INDEX "creature_sizes_is_active_sort_order_idx" ON "creature_sizes"("is_active", "sort_order");

ALTER TABLE "creature_tiers" ADD COLUMN "size_id" UUID;
CREATE INDEX "creature_tiers_size_id_idx" ON "creature_tiers"("size_id");
ALTER TABLE "creature_tiers"
ADD CONSTRAINT "creature_tiers_size_id_fkey"
FOREIGN KEY ("size_id") REFERENCES "creature_sizes"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
