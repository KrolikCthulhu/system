CREATE TYPE "WeaponAttackProfileKind" AS ENUM ('MELEE', 'RANGED');

CREATE TABLE "weapon_attack_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "weapon_id" UUID NOT NULL,
    "kind" "WeaponAttackProfileKind" NOT NULL,
    "name" TEXT NOT NULL,
    "skill_id" UUID NOT NULL,
    "base_cost" INTEGER NOT NULL DEFAULT 0,
    "base_damage" INTEGER NOT NULL DEFAULT 0,
    "range_meters" INTEGER NOT NULL DEFAULT 1,
    "uses_ammo" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weapon_attack_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "weapon_attack_profile_intents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "combat_intent_id" UUID NOT NULL,
    "cost_modifier" INTEGER NOT NULL DEFAULT 0,
    "damage_modifier" INTEGER NOT NULL DEFAULT 0,
    "rule_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weapon_attack_profile_intents_pkey" PRIMARY KEY ("id")
);

INSERT INTO "weapon_attack_profiles" (
    "weapon_id",
    "kind",
    "name",
    "skill_id",
    "base_damage",
    "range_meters",
    "uses_ammo",
    "is_active",
    "sort_order",
    "updated_at"
)
SELECT
    "id",
    'MELEE'::"WeaponAttackProfileKind",
    'Ближняя атака',
    "skill_id",
    "extra_damage",
    1,
    false,
    "is_active",
    0,
    CURRENT_TIMESTAMP
FROM "weapons";

CREATE UNIQUE INDEX "weapon_attack_profiles_weapon_id_kind_key" ON "weapon_attack_profiles"("weapon_id", "kind");
CREATE INDEX "weapon_attack_profiles_skill_id_idx" ON "weapon_attack_profiles"("skill_id");
CREATE INDEX "weapon_attack_profiles_weapon_id_sort_order_idx" ON "weapon_attack_profiles"("weapon_id", "sort_order");
CREATE UNIQUE INDEX "weapon_attack_profile_intents_profile_id_combat_intent_id_key" ON "weapon_attack_profile_intents"("profile_id", "combat_intent_id");
CREATE INDEX "weapon_attack_profile_intents_combat_intent_id_idx" ON "weapon_attack_profile_intents"("combat_intent_id");
CREATE INDEX "weapon_attack_profile_intents_profile_id_sort_order_idx" ON "weapon_attack_profile_intents"("profile_id", "sort_order");

ALTER TABLE "weapon_attack_profiles" ADD CONSTRAINT "weapon_attack_profiles_weapon_id_fkey" FOREIGN KEY ("weapon_id") REFERENCES "weapons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "weapon_attack_profiles" ADD CONSTRAINT "weapon_attack_profiles_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "weapon_attack_profile_intents" ADD CONSTRAINT "weapon_attack_profile_intents_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "weapon_attack_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "weapon_attack_profile_intents" ADD CONSTRAINT "weapon_attack_profile_intents_combat_intent_id_fkey" FOREIGN KEY ("combat_intent_id") REFERENCES "combat_intents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
