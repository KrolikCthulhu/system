CREATE TABLE "creature_tier_characteristics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "creature_tier_id" UUID NOT NULL,
    "characteristic_id" UUID NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creature_tier_characteristics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "creature_tier_characteristics_creature_tier_id_characteristic_id_key"
ON "creature_tier_characteristics"("creature_tier_id", "characteristic_id");

CREATE INDEX "creature_tier_characteristics_characteristic_id_idx"
ON "creature_tier_characteristics"("characteristic_id");

ALTER TABLE "creature_tier_characteristics"
ADD CONSTRAINT "creature_tier_characteristics_creature_tier_id_fkey"
FOREIGN KEY ("creature_tier_id") REFERENCES "creature_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creature_tier_characteristics"
ADD CONSTRAINT "creature_tier_characteristics_characteristic_id_fkey"
FOREIGN KEY ("characteristic_id") REFERENCES "characteristics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "creature_tier_characteristics" (
    "creature_tier_id",
    "characteristic_id",
    "value",
    "updated_at"
)
SELECT
    tier."id",
    characteristic."id",
    GREATEST(1, characteristic."default_value"),
    CURRENT_TIMESTAMP
FROM "creature_tiers" tier
CROSS JOIN "characteristics" characteristic
WHERE characteristic."is_active" = true;
