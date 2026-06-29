CREATE TYPE "SpellMechanicParameterScope" AS ENUM (
    'CASTER',
    'TARGET',
    'SPELL',
    'EFFECT',
    'ENVIRONMENT'
);

ALTER TABLE "spell_mechanic_parameters"
ADD COLUMN "scope" "SpellMechanicParameterScope" NOT NULL DEFAULT 'SPELL';

UPDATE "spell_mechanic_parameters"
SET "scope" = CASE
    WHEN "kind" = 'TARGET' THEN 'TARGET'::"SpellMechanicParameterScope"
    WHEN "kind" = 'SKILL' AND (
        lower("slug") LIKE '%zashchit%' OR
        lower("slug") LIKE '%zaschit%' OR
        lower("name") LIKE '%защит%'
    ) THEN 'TARGET'::"SpellMechanicParameterScope"
    WHEN "kind" = 'SKILL' AND (
        lower("slug") LIKE '%atak%' OR
        lower("name") LIKE '%атак%'
    ) THEN 'CASTER'::"SpellMechanicParameterScope"
    WHEN "kind" IN ('DAMAGE_TYPE', 'CONDITION') THEN 'EFFECT'::"SpellMechanicParameterScope"
    ELSE 'SPELL'::"SpellMechanicParameterScope"
END;
