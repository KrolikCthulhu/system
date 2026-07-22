ALTER TABLE "combat_intents"
ADD COLUMN "description" TEXT,
ADD COLUMN "mechanic" JSONB NOT NULL DEFAULT '{}';
