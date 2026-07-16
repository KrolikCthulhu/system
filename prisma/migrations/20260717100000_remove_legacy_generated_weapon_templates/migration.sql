UPDATE "weapons" AS weapon
SET "template_id" = template."id"
FROM "weapon_templates" AS template
WHERE weapon."slug" = 'mech'
  AND template."slug" = 'sredniy-odnoruchnyy-klinok';

UPDATE "weapons" AS weapon
SET "template_id" = template."id"
FROM "weapon_templates" AS template
WHERE weapon."slug" = 'dubina'
  AND template."slug" = 'srednee-odnoruchnoe-drobyaschee-oruzhie';

UPDATE "weapons" AS weapon
SET "template_id" = template."id"
FROM "weapon_templates" AS template
WHERE weapon."slug" = 'kope'
  AND template."slug" = 'srednee-drevkovoe-oruzhie';

DELETE FROM "weapon_templates" AS template
WHERE template."name" LIKE '%: базовый шаблон'
  AND NOT EXISTS (
    SELECT 1
    FROM "weapons" AS weapon
    WHERE weapon."template_id" = template."id"
  );
