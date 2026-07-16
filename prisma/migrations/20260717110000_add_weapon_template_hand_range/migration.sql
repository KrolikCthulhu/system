ALTER TABLE "weapon_templates"
    ADD COLUMN "hands_min" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "hands_max" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "default_hands" INTEGER NOT NULL DEFAULT 1;

UPDATE "weapon_templates"
SET
    "hands_min" = "hands",
    "hands_max" = "hands",
    "default_hands" = "hands";

UPDATE "weapon_templates"
SET
    "hands_min" = 1,
    "hands_max" = 2,
    "default_hands" = 1
WHERE "slug" IN ('polutornyy-klinok', 'polutornyy-topor');

ALTER TABLE "weapon_templates"
    DROP COLUMN "hands";
