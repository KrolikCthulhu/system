CREATE TABLE "natural_attacks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skill_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "natural_attacks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "natural_attack_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "natural_attack_id" UUID NOT NULL,
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

    CONSTRAINT "natural_attack_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "natural_attack_profile_intents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "combat_intent_id" UUID NOT NULL,
    "cost_modifier" INTEGER NOT NULL DEFAULT 0,
    "damage_modifier" INTEGER NOT NULL DEFAULT 0,
    "rule_text" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "natural_attack_profile_intents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "natural_attack_profile_damage_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "damage_type_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "natural_attack_profile_damage_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "natural_attacks_slug_key" ON "natural_attacks"("slug");
CREATE UNIQUE INDEX "natural_attacks_name_key" ON "natural_attacks"("name");
CREATE INDEX "natural_attacks_skill_id_idx" ON "natural_attacks"("skill_id");
CREATE INDEX "natural_attacks_is_active_sort_order_idx" ON "natural_attacks"("is_active", "sort_order");
CREATE UNIQUE INDEX "natural_attack_profiles_natural_attack_id_kind_key" ON "natural_attack_profiles"("natural_attack_id", "kind");
CREATE INDEX "natural_attack_profiles_skill_id_idx" ON "natural_attack_profiles"("skill_id");
CREATE INDEX "natural_attack_profiles_characteristic_id_idx" ON "natural_attack_profiles"("characteristic_id");
CREATE INDEX "natural_attack_profiles_natural_attack_id_sort_order_idx" ON "natural_attack_profiles"("natural_attack_id", "sort_order");
CREATE UNIQUE INDEX "natural_attack_profile_intents_profile_id_combat_intent_id_key" ON "natural_attack_profile_intents"("profile_id", "combat_intent_id");
CREATE INDEX "natural_attack_profile_intents_combat_intent_id_idx" ON "natural_attack_profile_intents"("combat_intent_id");
CREATE INDEX "natural_attack_profile_intents_profile_id_sort_order_idx" ON "natural_attack_profile_intents"("profile_id", "sort_order");
CREATE UNIQUE INDEX "natural_attack_profile_damage_types_profile_id_damage_type_id_key" ON "natural_attack_profile_damage_types"("profile_id", "damage_type_id");
CREATE INDEX "natural_attack_profile_damage_types_damage_type_id_idx" ON "natural_attack_profile_damage_types"("damage_type_id");
CREATE INDEX "natural_attack_profile_damage_types_profile_id_sort_order_idx" ON "natural_attack_profile_damage_types"("profile_id", "sort_order");

ALTER TABLE "natural_attacks" ADD CONSTRAINT "natural_attacks_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "natural_attack_profiles" ADD CONSTRAINT "natural_attack_profiles_natural_attack_id_fkey" FOREIGN KEY ("natural_attack_id") REFERENCES "natural_attacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "natural_attack_profiles" ADD CONSTRAINT "natural_attack_profiles_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "natural_attack_profiles" ADD CONSTRAINT "natural_attack_profiles_characteristic_id_fkey" FOREIGN KEY ("characteristic_id") REFERENCES "characteristics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "natural_attack_profile_intents" ADD CONSTRAINT "natural_attack_profile_intents_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "natural_attack_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "natural_attack_profile_intents" ADD CONSTRAINT "natural_attack_profile_intents_combat_intent_id_fkey" FOREIGN KEY ("combat_intent_id") REFERENCES "combat_intents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "natural_attack_profile_damage_types" ADD CONSTRAINT "natural_attack_profile_damage_types_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "natural_attack_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "natural_attack_profile_damage_types" ADD CONSTRAINT "natural_attack_profile_damage_types_damage_type_id_fkey" FOREIGN KEY ("damage_type_id") REFERENCES "damage_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
