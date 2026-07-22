ALTER TABLE "weapon_template_attack_profiles"
ADD COLUMN "can_be_parried" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "weapon_attack_profiles"
ADD COLUMN "can_be_parried" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "natural_attack_profiles"
ADD COLUMN "can_be_parried" BOOLEAN NOT NULL DEFAULT true;

UPDATE "weapon_template_attack_profiles"
SET "can_be_parried" = false
WHERE "kind" = 'RANGED';

UPDATE "weapon_attack_profiles"
SET "can_be_parried" = false
WHERE "kind" = 'RANGED';

UPDATE "natural_attack_profiles"
SET "can_be_parried" = false
WHERE "kind" = 'RANGED';
