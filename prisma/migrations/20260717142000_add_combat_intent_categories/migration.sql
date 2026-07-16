ALTER TABLE "combat_intents" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'Без категории';

CREATE INDEX "combat_intents_category_is_active_sort_order_idx" ON "combat_intents"("category", "is_active", "sort_order");
