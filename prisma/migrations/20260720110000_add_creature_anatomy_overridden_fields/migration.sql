ALTER TABLE "creature_anatomy_zones"
ADD COLUMN "overridden_fields" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
