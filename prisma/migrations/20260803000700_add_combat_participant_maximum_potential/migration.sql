ALTER TABLE "combat_encounter_participants"
ADD COLUMN "maximum_potential" INTEGER NOT NULL DEFAULT 0;

UPDATE "combat_encounter_participants"
SET "maximum_potential" = GREATEST("maximum_potential", "current_potential");
