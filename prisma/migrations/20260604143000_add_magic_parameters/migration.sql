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

CREATE TABLE "magic_word_damage_type_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "magic_word_id" UUID NOT NULL,
    "damage_type_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magic_word_damage_type_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "magic_word_condition_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "magic_word_id" UUID NOT NULL,
    "condition_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magic_word_condition_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "magic_word_damage_type_links_magic_word_id_idx" ON "magic_word_damage_type_links"("magic_word_id");
CREATE INDEX "magic_word_damage_type_links_damage_type_id_idx" ON "magic_word_damage_type_links"("damage_type_id");
CREATE UNIQUE INDEX "magic_word_damage_type_links_magic_word_id_damage_type_id_key" ON "magic_word_damage_type_links"("magic_word_id", "damage_type_id");

CREATE INDEX "magic_word_condition_links_magic_word_id_idx" ON "magic_word_condition_links"("magic_word_id");
CREATE INDEX "magic_word_condition_links_condition_id_idx" ON "magic_word_condition_links"("condition_id");
CREATE UNIQUE INDEX "magic_word_condition_links_magic_word_id_condition_id_key" ON "magic_word_condition_links"("magic_word_id", "condition_id");

ALTER TABLE "magic_word_damage_type_links" ADD CONSTRAINT "magic_word_damage_type_links_magic_word_id_fkey" FOREIGN KEY ("magic_word_id") REFERENCES "magic_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "magic_word_damage_type_links" ADD CONSTRAINT "magic_word_damage_type_links_damage_type_id_fkey" FOREIGN KEY ("damage_type_id") REFERENCES "damage_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "magic_word_condition_links" ADD CONSTRAINT "magic_word_condition_links_magic_word_id_fkey" FOREIGN KEY ("magic_word_id") REFERENCES "magic_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "magic_word_condition_links" ADD CONSTRAINT "magic_word_condition_links_condition_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "conditions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
