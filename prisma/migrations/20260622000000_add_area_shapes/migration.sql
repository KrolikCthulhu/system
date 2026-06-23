CREATE TYPE "AreaShapeKind" AS ENUM (
    'POINT',
    'LINE',
    'CONE',
    'SPHERE',
    'CUBE',
    'CYLINDER',
    'RING'
);

CREATE TABLE "area_shapes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gesture_id" UUID NOT NULL,
    "kind" "AreaShapeKind" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dimensions" JSONB NOT NULL DEFAULT '{}',
    "influence_config" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "area_shapes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "area_shapes_gesture_id_key" ON "area_shapes"("gesture_id");
CREATE INDEX "area_shapes_kind_is_active_sort_order_idx" ON "area_shapes"("kind", "is_active", "sort_order");
CREATE INDEX "area_shapes_gesture_id_idx" ON "area_shapes"("gesture_id");

ALTER TABLE "area_shapes"
ADD CONSTRAINT "area_shapes_gesture_id_fkey"
FOREIGN KEY ("gesture_id") REFERENCES "magic_words"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
