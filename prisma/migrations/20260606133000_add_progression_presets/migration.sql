CREATE TYPE "ProgressionPresetKind" AS ENUM (
    'LINEAR',
    'STEP',
    'QUADRATIC',
    'SQUARE_ROOT',
    'LOGARITHMIC',
    'SATURATION',
    'PERCENT'
);

CREATE TABLE "progression_presets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "kind" "ProgressionPresetKind" NOT NULL,
    "config" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progression_presets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "progression_presets_name_key" ON "progression_presets"("name");
CREATE INDEX "progression_presets_kind_is_active_sort_order_idx" ON "progression_presets"("kind", "is_active", "sort_order");
CREATE INDEX "progression_presets_is_active_sort_order_idx" ON "progression_presets"("is_active", "sort_order");
