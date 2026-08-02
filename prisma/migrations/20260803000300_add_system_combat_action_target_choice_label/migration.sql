ALTER TABLE "system_combat_actions"
ADD COLUMN "target_choice_label" TEXT;

UPDATE "system_combat_actions"
SET "target_choice_label" = 'Действовать после'
WHERE "core_key" = 'wait_until_after_participant'
	AND "target_choice_label" IS NULL;
