CREATE TABLE "system_combat_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "core_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "option_label_template" TEXT,
    "cost_label_template" TEXT,
    "unavailable_text" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_combat_actions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "system_combat_actions_core_key_key" ON "system_combat_actions"("core_key");
CREATE INDEX "system_combat_actions_is_enabled_sort_order_idx" ON "system_combat_actions"("is_enabled", "sort_order");
