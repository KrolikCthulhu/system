-- CreateEnum
CREATE TYPE "SpellMechanicParameterKind" AS ENUM (
    'TARGET',
    'SKILL',
    'NUMBER',
    'FORMULA',
    'DAMAGE_TYPE',
    'CONDITION',
    'SYSTEM_VALUE',
    'TEXT'
);

-- CreateEnum
CREATE TYPE "SpellMechanicParameterDefaultMode" AS ENUM (
    'EMPTY',
    'STATIC',
    'FROM_MAGIC_WORD'
);

-- CreateTable
CREATE TABLE "spell_mechanic_parameters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mechanic_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "SpellMechanicParameterKind" NOT NULL,
    "default_mode" "SpellMechanicParameterDefaultMode" NOT NULL DEFAULT 'EMPTY',
    "static_skill_id" UUID,
    "static_damage_type_id" UUID,
    "static_condition_id" UUID,
    "static_system_value_id" UUID,
    "static_text_value" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "configured_by_spell" BOOLEAN NOT NULL DEFAULT true,
    "override_allowed" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spell_mechanic_parameters_pkey" PRIMARY KEY ("id")
);

-- DataMigration
INSERT INTO "spell_mechanic_parameters" (
    "mechanic_id",
    "name",
    "kind",
    "default_mode",
    "static_skill_id",
    "static_damage_type_id",
    "static_condition_id",
    "static_system_value_id",
    "static_text_value",
    "is_required",
    "configured_by_spell",
    "override_allowed",
    "sort_order",
    "updated_at"
)
SELECT
    "spell_mechanics"."id",
    COALESCE(
        NULLIF("slot"."value"->>'name', ''),
        NULLIF("slot"."value"->>'label', ''),
        NULLIF("slot"."value"->>'id', ''),
        'Параметр'
    ),
    CASE "slot"."value"->>'kind'
        WHEN 'target' THEN 'TARGET'::"SpellMechanicParameterKind"
        WHEN 'skill' THEN 'SKILL'::"SpellMechanicParameterKind"
        WHEN 'number' THEN 'NUMBER'::"SpellMechanicParameterKind"
        WHEN 'formula' THEN 'FORMULA'::"SpellMechanicParameterKind"
        WHEN 'damageType' THEN 'DAMAGE_TYPE'::"SpellMechanicParameterKind"
        WHEN 'condition' THEN 'CONDITION'::"SpellMechanicParameterKind"
        WHEN 'systemValue' THEN 'SYSTEM_VALUE'::"SpellMechanicParameterKind"
        WHEN 'text' THEN 'TEXT'::"SpellMechanicParameterKind"
        ELSE 'TEXT'::"SpellMechanicParameterKind"
    END,
    CASE COALESCE("slot"."value"->'defaultValue'->>'mode', 'empty')
        WHEN 'static' THEN 'STATIC'::"SpellMechanicParameterDefaultMode"
        WHEN 'fromMagicWord' THEN 'FROM_MAGIC_WORD'::"SpellMechanicParameterDefaultMode"
        ELSE 'EMPTY'::"SpellMechanicParameterDefaultMode"
    END,
    CASE
        WHEN "slot"."value"->>'kind' = 'skill'
            AND "slot"."value"->'defaultValue'->>'mode' = 'static'
            AND "slot"."value"->'defaultValue'->>'value' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN ("slot"."value"->'defaultValue'->>'value')::uuid
        ELSE NULL
    END,
    CASE
        WHEN "slot"."value"->>'kind' = 'damageType'
            AND "slot"."value"->'defaultValue'->>'mode' = 'static'
            AND "slot"."value"->'defaultValue'->>'value' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN ("slot"."value"->'defaultValue'->>'value')::uuid
        ELSE NULL
    END,
    CASE
        WHEN "slot"."value"->>'kind' = 'condition'
            AND "slot"."value"->'defaultValue'->>'mode' = 'static'
            AND "slot"."value"->'defaultValue'->>'value' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN ("slot"."value"->'defaultValue'->>'value')::uuid
        ELSE NULL
    END,
    CASE
        WHEN "slot"."value"->>'kind' = 'systemValue'
            AND "slot"."value"->'defaultValue'->>'mode' = 'static'
            AND "slot"."value"->'defaultValue'->>'value' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN ("slot"."value"->'defaultValue'->>'value')::uuid
        ELSE NULL
    END,
    CASE
        WHEN "slot"."value"->>'kind' IN ('number', 'formula', 'text')
            AND "slot"."value"->'defaultValue'->>'mode' = 'static'
        THEN "slot"."value"->'defaultValue'->>'value'
        ELSE NULL
    END,
    COALESCE(("slot"."value"->>'required')::boolean, true),
    COALESCE(("slot"."value"->>'configuredBySpell')::boolean, true),
    COALESCE(("slot"."value"->>'overrideAllowed')::boolean, false),
    "slot"."ordinality" - 1,
    CURRENT_TIMESTAMP
FROM "spell_mechanics"
CROSS JOIN LATERAL jsonb_array_elements(
    COALESCE("spell_mechanics"."config_schema"::jsonb->'slots', '[]'::jsonb)
) WITH ORDINALITY AS "slot"("value", "ordinality");

UPDATE "spell_mechanics"
SET "config_schema" = "config_schema"::jsonb - 'slots'
WHERE "config_schema"::jsonb ? 'slots';

-- CreateIndex
CREATE INDEX "spell_mechanic_parameters_mechanic_id_sort_order_idx" ON "spell_mechanic_parameters"("mechanic_id", "sort_order");

-- CreateIndex
CREATE INDEX "spell_mechanic_parameters_static_skill_id_idx" ON "spell_mechanic_parameters"("static_skill_id");

-- CreateIndex
CREATE INDEX "spell_mechanic_parameters_static_damage_type_id_idx" ON "spell_mechanic_parameters"("static_damage_type_id");

-- CreateIndex
CREATE INDEX "spell_mechanic_parameters_static_condition_id_idx" ON "spell_mechanic_parameters"("static_condition_id");

-- CreateIndex
CREATE INDEX "spell_mechanic_parameters_static_system_value_id_idx" ON "spell_mechanic_parameters"("static_system_value_id");

-- AddForeignKey
ALTER TABLE "spell_mechanic_parameters" ADD CONSTRAINT "spell_mechanic_parameters_mechanic_id_fkey" FOREIGN KEY ("mechanic_id") REFERENCES "spell_mechanics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spell_mechanic_parameters" ADD CONSTRAINT "spell_mechanic_parameters_static_skill_id_fkey" FOREIGN KEY ("static_skill_id") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spell_mechanic_parameters" ADD CONSTRAINT "spell_mechanic_parameters_static_damage_type_id_fkey" FOREIGN KEY ("static_damage_type_id") REFERENCES "damage_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spell_mechanic_parameters" ADD CONSTRAINT "spell_mechanic_parameters_static_condition_id_fkey" FOREIGN KEY ("static_condition_id") REFERENCES "conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spell_mechanic_parameters" ADD CONSTRAINT "spell_mechanic_parameters_static_system_value_id_fkey" FOREIGN KEY ("static_system_value_id") REFERENCES "system_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;
