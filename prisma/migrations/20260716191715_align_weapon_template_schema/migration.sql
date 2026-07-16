-- AlterTable
ALTER TABLE "weapon_templates" ALTER COLUMN "slug" DROP DEFAULT;

-- RenameIndex
ALTER INDEX "weapon_template_attack_profile_intents_profile_id_combat_intent" RENAME TO "weapon_template_attack_profile_intents_profile_id_combat_in_key";

-- RenameIndex
ALTER INDEX "weapon_template_attack_profile_intents_profile_id_sort_order_id" RENAME TO "weapon_template_attack_profile_intents_profile_id_sort_orde_idx";
