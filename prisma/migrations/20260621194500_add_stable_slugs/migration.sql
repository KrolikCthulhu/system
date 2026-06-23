ALTER TABLE "skill_categories" ADD COLUMN "slug" TEXT;
UPDATE "skill_categories"
SET "slug" = 'skill-category-' || substring("id"::text, 1, 8)
WHERE "slug" IS NULL;
ALTER TABLE "skill_categories" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "skill_categories_slug_key" ON "skill_categories"("slug");

ALTER TABLE "skills" ADD COLUMN "slug" TEXT;
UPDATE "skills"
SET "slug" = 'skill-' || substring("id"::text, 1, 8)
WHERE "slug" IS NULL;
ALTER TABLE "skills" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

ALTER TABLE "magic_words" ADD COLUMN "slug" TEXT;
UPDATE "magic_words"
SET "slug" = lower("type"::text) || '-' || substring("id"::text, 1, 8)
WHERE "slug" IS NULL;
ALTER TABLE "magic_words" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "magic_words_type_slug_key" ON "magic_words"("type", "slug");

ALTER TABLE "spell_mechanic_categories" ADD COLUMN "slug" TEXT;
UPDATE "spell_mechanic_categories"
SET "slug" = 'spell-mechanic-category-' || substring("id"::text, 1, 8)
WHERE "slug" IS NULL;
ALTER TABLE "spell_mechanic_categories" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "spell_mechanic_categories_slug_key" ON "spell_mechanic_categories"("slug");

ALTER TABLE "spell_mechanics" ADD COLUMN "slug" TEXT;
UPDATE "spell_mechanics"
SET "slug" = 'spell-mechanic-' || substring("id"::text, 1, 8)
WHERE "slug" IS NULL;
ALTER TABLE "spell_mechanics" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "spell_mechanics_slug_key" ON "spell_mechanics"("slug");

ALTER TABLE "spell_mechanic_parameters" ADD COLUMN "slug" TEXT;
UPDATE "spell_mechanic_parameters"
SET "slug" = 'parameter-' || replace("id"::text, '-', '')
WHERE "slug" IS NULL;
ALTER TABLE "spell_mechanic_parameters" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "spell_mechanic_parameters_mechanic_id_slug_key" ON "spell_mechanic_parameters"("mechanic_id", "slug");

ALTER TABLE "damage_types" ADD COLUMN "slug" TEXT;
UPDATE "damage_types"
SET "slug" = 'damage-type-' || substring("id"::text, 1, 8)
WHERE "slug" IS NULL;
ALTER TABLE "damage_types" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "damage_types_slug_key" ON "damage_types"("slug");

ALTER TABLE "conditions" ADD COLUMN "slug" TEXT;
UPDATE "conditions"
SET "slug" = 'condition-' || substring("id"::text, 1, 8)
WHERE "slug" IS NULL;
ALTER TABLE "conditions" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "conditions_slug_key" ON "conditions"("slug");

ALTER TABLE "progression_presets" ADD COLUMN "slug" TEXT;
UPDATE "progression_presets"
SET "slug" = 'progression-preset-' || substring("id"::text, 1, 8)
WHERE "slug" IS NULL;
ALTER TABLE "progression_presets" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "progression_presets_slug_key" ON "progression_presets"("slug");

ALTER TABLE "system_values" ADD COLUMN "slug" TEXT;
UPDATE "system_values"
SET "slug" = 'system-value-' || substring("id"::text, 1, 8)
WHERE "slug" IS NULL;
ALTER TABLE "system_values" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "system_values_slug_key" ON "system_values"("slug");
