CREATE TYPE "CombatEncounterStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');

CREATE TYPE "CombatEncounterParticipantKind" AS ENUM ('PLAYER_CHARACTER', 'CREATURE');

CREATE TABLE "combat_encounters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CombatEncounterStatus" NOT NULL DEFAULT 'DRAFT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combat_encounters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "combat_encounter_participants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "encounter_id" UUID NOT NULL,
    "kind" "CombatEncounterParticipantKind" NOT NULL,
    "player_character_id" UUID,
    "creature_id" UUID,
    "creature_tier_id" UUID,
    "scene_name" TEXT NOT NULL,
    "current_health" INTEGER NOT NULL DEFAULT 0,
    "current_potential" INTEGER NOT NULL DEFAULT 0,
    "initiative" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combat_encounter_participants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "combat_encounters_campaign_id_status_idx" ON "combat_encounters"("campaign_id", "status");
CREATE INDEX "combat_encounters_campaign_id_is_active_updated_at_idx" ON "combat_encounters"("campaign_id", "is_active", "updated_at");
CREATE INDEX "combat_encounter_participants_encounter_id_sort_order_idx" ON "combat_encounter_participants"("encounter_id", "sort_order");
CREATE INDEX "combat_encounter_participants_player_character_id_idx" ON "combat_encounter_participants"("player_character_id");
CREATE INDEX "combat_encounter_participants_creature_id_idx" ON "combat_encounter_participants"("creature_id");
CREATE INDEX "combat_encounter_participants_creature_tier_id_idx" ON "combat_encounter_participants"("creature_tier_id");

ALTER TABLE "combat_encounters"
ADD CONSTRAINT "combat_encounters_campaign_id_fkey"
FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "combat_encounter_participants"
ADD CONSTRAINT "combat_encounter_participants_encounter_id_fkey"
FOREIGN KEY ("encounter_id") REFERENCES "combat_encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "combat_encounter_participants"
ADD CONSTRAINT "combat_encounter_participants_player_character_id_fkey"
FOREIGN KEY ("player_character_id") REFERENCES "player_characters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "combat_encounter_participants"
ADD CONSTRAINT "combat_encounter_participants_creature_id_fkey"
FOREIGN KEY ("creature_id") REFERENCES "creatures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "combat_encounter_participants"
ADD CONSTRAINT "combat_encounter_participants_creature_tier_id_fkey"
FOREIGN KEY ("creature_tier_id") REFERENCES "creature_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
