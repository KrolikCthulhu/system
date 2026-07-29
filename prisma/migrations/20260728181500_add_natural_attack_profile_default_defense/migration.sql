ALTER TABLE "natural_attack_profiles"
ADD COLUMN "default_defense" JSONB NOT NULL DEFAULT '{}';
