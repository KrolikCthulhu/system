CREATE TABLE "damage_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "damage_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conditions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conditions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "damage_types_name_key" ON "damage_types"("name");
CREATE INDEX "damage_types_is_active_sort_order_idx" ON "damage_types"("is_active", "sort_order");

CREATE UNIQUE INDEX "conditions_name_key" ON "conditions"("name");
CREATE INDEX "conditions_is_active_sort_order_idx" ON "conditions"("is_active", "sort_order");
