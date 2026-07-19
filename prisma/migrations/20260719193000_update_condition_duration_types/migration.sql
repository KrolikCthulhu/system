ALTER TABLE "conditions"
ALTER COLUMN "duration_type" SET DEFAULT 'until_owner_next_activation';

UPDATE "conditions"
SET "duration_type" = CASE "duration_type"
	WHEN 'until_action_end' THEN 'until_owner_next_activation'
	WHEN 'until_next_action_start' THEN 'until_owner_next_activation'
	WHEN 'until_round_end' THEN 'until_next_round_start'
	WHEN 'until_rest' THEN 'until_short_rest'
	WHEN 'while_condition' THEN 'until_removed'
	ELSE "duration_type"
END
WHERE "duration_type" IN (
	'until_action_end',
	'until_next_action_start',
	'until_round_end',
	'until_rest',
	'while_condition'
);
