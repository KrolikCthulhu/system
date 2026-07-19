ALTER TABLE "conditions"
ADD COLUMN "repeat_level_mode" TEXT NOT NULL DEFAULT 'keep_current',
ADD COLUMN "repeat_duration_mode" TEXT NOT NULL DEFAULT 'keep_current';

UPDATE "conditions"
SET "repeat_level_mode" = 'add'
WHERE "stack_mode" = 'increase_level';

UPDATE "conditions"
SET "repeat_duration_mode" = 'add'
WHERE "stack_mode" = 'increase_duration';

ALTER TABLE "conditions"
DROP COLUMN "stack_mode";
