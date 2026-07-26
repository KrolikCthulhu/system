ALTER TABLE "creatures" ADD COLUMN "actions" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "creature_tiers" ADD COLUMN "action_overrides" JSONB NOT NULL DEFAULT '[]';
