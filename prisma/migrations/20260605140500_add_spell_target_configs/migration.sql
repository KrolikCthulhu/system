ALTER TABLE "spells"
ADD COLUMN "target_configs" JSONB NOT NULL DEFAULT '[]';
