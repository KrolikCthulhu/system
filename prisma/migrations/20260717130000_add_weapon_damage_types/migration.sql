CREATE TABLE "weapon_template_attack_profile_damage_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "damage_type_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "weapon_template_attack_profile_damage_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "weapon_attack_profile_damage_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "damage_type_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "weapon_attack_profile_damage_types_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "weapon_template_attack_profile_intents" ADD COLUMN "damage_type_id" UUID;
ALTER TABLE "weapon_attack_profile_intents" ADD COLUMN "damage_type_id" UUID;

CREATE UNIQUE INDEX "weapon_template_attack_profile_damage_types_profile_id_damage_type_id_key" ON "weapon_template_attack_profile_damage_types"("profile_id", "damage_type_id");
CREATE INDEX "weapon_template_attack_profile_damage_types_damage_type_id_idx" ON "weapon_template_attack_profile_damage_types"("damage_type_id");
CREATE INDEX "weapon_template_attack_profile_damage_types_profile_id_sort_order_idx" ON "weapon_template_attack_profile_damage_types"("profile_id", "sort_order");
CREATE UNIQUE INDEX "weapon_attack_profile_damage_types_profile_id_damage_type_id_key" ON "weapon_attack_profile_damage_types"("profile_id", "damage_type_id");
CREATE INDEX "weapon_attack_profile_damage_types_damage_type_id_idx" ON "weapon_attack_profile_damage_types"("damage_type_id");
CREATE INDEX "weapon_attack_profile_damage_types_profile_id_sort_order_idx" ON "weapon_attack_profile_damage_types"("profile_id", "sort_order");
CREATE INDEX "weapon_template_attack_profile_intents_damage_type_id_idx" ON "weapon_template_attack_profile_intents"("damage_type_id");
CREATE INDEX "weapon_attack_profile_intents_damage_type_id_idx" ON "weapon_attack_profile_intents"("damage_type_id");

ALTER TABLE "weapon_template_attack_profile_damage_types" ADD CONSTRAINT "weapon_template_attack_profile_damage_types_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "weapon_template_attack_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "weapon_template_attack_profile_damage_types" ADD CONSTRAINT "weapon_template_attack_profile_damage_types_damage_type_id_fkey" FOREIGN KEY ("damage_type_id") REFERENCES "damage_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "weapon_attack_profile_damage_types" ADD CONSTRAINT "weapon_attack_profile_damage_types_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "weapon_attack_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "weapon_attack_profile_damage_types" ADD CONSTRAINT "weapon_attack_profile_damage_types_damage_type_id_fkey" FOREIGN KEY ("damage_type_id") REFERENCES "damage_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "weapon_template_attack_profile_intents" ADD CONSTRAINT "weapon_template_attack_profile_intents_damage_type_id_fkey" FOREIGN KEY ("damage_type_id") REFERENCES "damage_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "weapon_attack_profile_intents" ADD CONSTRAINT "weapon_attack_profile_intents_damage_type_id_fkey" FOREIGN KEY ("damage_type_id") REFERENCES "damage_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
