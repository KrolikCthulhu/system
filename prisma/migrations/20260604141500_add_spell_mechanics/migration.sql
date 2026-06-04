CREATE TABLE "spell_mechanic_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spell_mechanic_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "spell_mechanics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "config_schema" JSONB NOT NULL DEFAULT '{}',
    "text_template" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spell_mechanics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "spell_mechanic_categories_name_key" ON "spell_mechanic_categories"("name");
CREATE INDEX "spell_mechanic_categories_is_active_sort_order_idx" ON "spell_mechanic_categories"("is_active", "sort_order");

CREATE UNIQUE INDEX "spell_mechanics_name_key" ON "spell_mechanics"("name");
CREATE INDEX "spell_mechanics_category_id_idx" ON "spell_mechanics"("category_id");
CREATE INDEX "spell_mechanics_category_id_is_active_sort_order_idx" ON "spell_mechanics"("category_id", "is_active", "sort_order");

ALTER TABLE "spell_mechanics" ADD CONSTRAINT "spell_mechanics_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "spell_mechanic_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
