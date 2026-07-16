ALTER TABLE "weapon_template_attack_profile_intents" DROP CONSTRAINT IF EXISTS "weapon_template_attack_profile_intents_damage_type_id_fkey";
ALTER TABLE "weapon_attack_profile_intents" DROP CONSTRAINT IF EXISTS "weapon_attack_profile_intents_damage_type_id_fkey";

DROP INDEX IF EXISTS "weapon_template_attack_profile_intents_damage_type_id_idx";
DROP INDEX IF EXISTS "weapon_attack_profile_intents_damage_type_id_idx";

ALTER TABLE "weapon_template_attack_profile_intents" DROP COLUMN IF EXISTS "damage_type_id";
ALTER TABLE "weapon_attack_profile_intents" DROP COLUMN IF EXISTS "damage_type_id";
