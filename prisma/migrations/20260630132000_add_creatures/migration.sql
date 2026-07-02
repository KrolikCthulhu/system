CREATE TABLE "creatures" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creatures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "creature_tiers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "creature_id" UUID NOT NULL,
    "tier" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "hp" INTEGER NOT NULL DEFAULT 1,
    "armor_preset_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creature_tiers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "creature_tier_skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "creature_tier_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creature_tier_skills_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "creatures_slug_key" ON "creatures"("slug");

CREATE UNIQUE INDEX "creatures_name_key" ON "creatures"("name");

CREATE INDEX "creatures_type_id_is_active_sort_order_idx" ON "creatures"("type_id", "is_active", "sort_order");

CREATE INDEX "creatures_is_active_sort_order_idx" ON "creatures"("is_active", "sort_order");

CREATE UNIQUE INDEX "creature_tiers_creature_id_tier_key" ON "creature_tiers"("creature_id", "tier");

CREATE INDEX "creature_tiers_armor_preset_id_idx" ON "creature_tiers"("armor_preset_id");

CREATE INDEX "creature_tiers_creature_id_sort_order_idx" ON "creature_tiers"("creature_id", "sort_order");

CREATE UNIQUE INDEX "creature_tier_skills_creature_tier_id_skill_id_key" ON "creature_tier_skills"("creature_tier_id", "skill_id");

CREATE INDEX "creature_tier_skills_skill_id_idx" ON "creature_tier_skills"("skill_id");

ALTER TABLE "creatures" ADD CONSTRAINT "creatures_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "creature_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "creature_tiers" ADD CONSTRAINT "creature_tiers_creature_id_fkey" FOREIGN KEY ("creature_id") REFERENCES "creatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creature_tiers" ADD CONSTRAINT "creature_tiers_armor_preset_id_fkey" FOREIGN KEY ("armor_preset_id") REFERENCES "armor_presets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "creature_tier_skills" ADD CONSTRAINT "creature_tier_skills_creature_tier_id_fkey" FOREIGN KEY ("creature_tier_id") REFERENCES "creature_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creature_tier_skills" ADD CONSTRAINT "creature_tier_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
