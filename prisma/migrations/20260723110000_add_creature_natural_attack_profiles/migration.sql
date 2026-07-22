ALTER TABLE "creature_natural_attacks"
ADD COLUMN "attack_profiles" JSONB NOT NULL DEFAULT '[]';
