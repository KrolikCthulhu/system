ALTER TABLE "conditions"
ALTER COLUMN "repeat_level_mode" SET DEFAULT 'keep_highest',
ALTER COLUMN "repeat_duration_mode" SET DEFAULT 'keep_highest';

UPDATE "conditions"
SET "repeat_level_mode" = 'keep_highest'
WHERE "repeat_level_mode" = 'keep_current';

UPDATE "conditions"
SET "repeat_duration_mode" = 'keep_highest'
WHERE "repeat_duration_mode" = 'keep_current';
