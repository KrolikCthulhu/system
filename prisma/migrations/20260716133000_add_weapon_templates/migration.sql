CREATE TABLE "weapon_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "skill_id" UUID NOT NULL,
    "hands" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weapon_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "weapon_template_attack_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_id" UUID NOT NULL,
    "kind" "WeaponAttackProfileKind" NOT NULL,
    "name" TEXT NOT NULL,
    "skill_id" UUID NOT NULL,
    "characteristic_id" UUID,
    "base_cost" INTEGER NOT NULL DEFAULT 0,
    "base_damage" INTEGER NOT NULL DEFAULT 0,
    "range_meters" INTEGER NOT NULL DEFAULT 1,
    "uses_ammo" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weapon_template_attack_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "weapon_template_attack_profile_intents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "combat_intent_id" UUID NOT NULL,
    "cost_modifier" INTEGER NOT NULL DEFAULT 0,
    "damage_modifier" INTEGER NOT NULL DEFAULT 0,
    "rule_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weapon_template_attack_profile_intents_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "weapon_attack_profiles" ADD COLUMN "characteristic_id" UUID;
ALTER TABLE "weapons" ADD COLUMN "template_id" UUID;

UPDATE "weapon_attack_profiles" AS profile
SET "characteristic_id" = skill."roll_characteristic_id"
FROM "skills" AS skill
WHERE profile."skill_id" = skill."id";

INSERT INTO "weapon_templates" (
    "slug",
    "name",
    "skill_id",
    "hands",
    "is_active",
    "sort_order",
    "updated_at"
)
SELECT
    "slug" || '-template',
    "name" || ': базовый шаблон',
    "skill_id",
    1,
    "is_active",
    "sort_order",
    CURRENT_TIMESTAMP
FROM "weapons";

UPDATE "weapons" AS weapon
SET "template_id" = template."id"
FROM "weapon_templates" AS template
WHERE template."slug" = weapon."slug" || '-template';

INSERT INTO "weapon_template_attack_profiles" (
    "template_id",
    "kind",
    "name",
    "skill_id",
    "characteristic_id",
    "base_cost",
    "base_damage",
    "range_meters",
    "uses_ammo",
    "is_active",
    "sort_order",
    "updated_at"
)
SELECT
    weapon."template_id",
    profile."kind",
    profile."name",
    profile."skill_id",
    profile."characteristic_id",
    profile."base_cost",
    profile."base_damage",
    profile."range_meters",
    profile."uses_ammo",
    profile."is_active",
    profile."sort_order",
    CURRENT_TIMESTAMP
FROM "weapon_attack_profiles" AS profile
JOIN "weapons" AS weapon ON weapon."id" = profile."weapon_id";

INSERT INTO "weapon_template_attack_profile_intents" (
    "profile_id",
    "combat_intent_id",
    "cost_modifier",
    "damage_modifier",
    "rule_text",
    "sort_order",
    "updated_at"
)
SELECT
    template_profile."id",
    intent."combat_intent_id",
    intent."cost_modifier",
    intent."damage_modifier",
    intent."rule_text",
    intent."sort_order",
    CURRENT_TIMESTAMP
FROM "weapon_attack_profile_intents" AS intent
JOIN "weapon_attack_profiles" AS weapon_profile ON weapon_profile."id" = intent."profile_id"
JOIN "weapons" AS weapon ON weapon."id" = weapon_profile."weapon_id"
JOIN "weapon_template_attack_profiles" AS template_profile
    ON template_profile."template_id" = weapon."template_id"
    AND template_profile."kind" = weapon_profile."kind";

ALTER TABLE "weapons" ALTER COLUMN "template_id" SET NOT NULL;

CREATE UNIQUE INDEX "weapon_templates_slug_key" ON "weapon_templates"("slug");
CREATE UNIQUE INDEX "weapon_templates_name_key" ON "weapon_templates"("name");
CREATE INDEX "weapon_templates_skill_id_idx" ON "weapon_templates"("skill_id");
CREATE INDEX "weapon_templates_is_active_sort_order_idx" ON "weapon_templates"("is_active", "sort_order");
CREATE UNIQUE INDEX "weapon_template_attack_profiles_template_id_kind_key" ON "weapon_template_attack_profiles"("template_id", "kind");
CREATE INDEX "weapon_template_attack_profiles_skill_id_idx" ON "weapon_template_attack_profiles"("skill_id");
CREATE INDEX "weapon_template_attack_profiles_characteristic_id_idx" ON "weapon_template_attack_profiles"("characteristic_id");
CREATE INDEX "weapon_template_attack_profiles_template_id_sort_order_idx" ON "weapon_template_attack_profiles"("template_id", "sort_order");
CREATE UNIQUE INDEX "weapon_template_attack_profile_intents_profile_id_combat_intent_id_key" ON "weapon_template_attack_profile_intents"("profile_id", "combat_intent_id");
CREATE INDEX "weapon_template_attack_profile_intents_combat_intent_id_idx" ON "weapon_template_attack_profile_intents"("combat_intent_id");
CREATE INDEX "weapon_template_attack_profile_intents_profile_id_sort_order_idx" ON "weapon_template_attack_profile_intents"("profile_id", "sort_order");
CREATE INDEX "weapons_template_id_idx" ON "weapons"("template_id");
CREATE INDEX "weapon_attack_profiles_characteristic_id_idx" ON "weapon_attack_profiles"("characteristic_id");

ALTER TABLE "weapon_templates" ADD CONSTRAINT "weapon_templates_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "weapon_template_attack_profiles" ADD CONSTRAINT "weapon_template_attack_profiles_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "weapon_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "weapon_template_attack_profiles" ADD CONSTRAINT "weapon_template_attack_profiles_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "weapon_template_attack_profiles" ADD CONSTRAINT "weapon_template_attack_profiles_characteristic_id_fkey" FOREIGN KEY ("characteristic_id") REFERENCES "characteristics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "weapon_template_attack_profile_intents" ADD CONSTRAINT "weapon_template_attack_profile_intents_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "weapon_template_attack_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "weapon_template_attack_profile_intents" ADD CONSTRAINT "weapon_template_attack_profile_intents_combat_intent_id_fkey" FOREIGN KEY ("combat_intent_id") REFERENCES "combat_intents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "weapons" ADD CONSTRAINT "weapons_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "weapon_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "weapon_attack_profiles" ADD CONSTRAINT "weapon_attack_profiles_characteristic_id_fkey" FOREIGN KEY ("characteristic_id") REFERENCES "characteristics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
