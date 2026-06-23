UPDATE "spell_mechanic_blocks" AS block
SET "parameter_values" = COALESCE(
	(
		SELECT jsonb_object_agg(COALESCE(parameter."slug", entry."key"), entry."value")
		FROM jsonb_each(block."parameter_values"::jsonb) AS entry("key", "value")
		LEFT JOIN "spell_mechanic_parameters" AS parameter
			ON parameter."mechanic_id" = block."mechanic_id"
			AND parameter."id"::text = entry."key"
	),
	'{}'::jsonb
)
WHERE EXISTS (
	SELECT 1
	FROM jsonb_object_keys(block."parameter_values"::jsonb) AS entry("key")
	WHERE entry."key" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);
