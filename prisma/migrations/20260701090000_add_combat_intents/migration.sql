CREATE TABLE "combat_intents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combat_intents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "combat_intents_slug_key" ON "combat_intents"("slug");
CREATE UNIQUE INDEX "combat_intents_name_key" ON "combat_intents"("name");
CREATE INDEX "combat_intents_is_active_sort_order_idx" ON "combat_intents"("is_active", "sort_order");
