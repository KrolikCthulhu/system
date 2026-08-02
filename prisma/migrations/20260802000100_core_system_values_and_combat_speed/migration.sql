ALTER TABLE "system_values" ADD COLUMN "core_key" TEXT;

CREATE UNIQUE INDEX "system_values_core_key_key" ON "system_values"("core_key");
CREATE INDEX "system_values_core_key_idx" ON "system_values"("core_key");

ALTER TABLE "combat_encounter_participants"
	ADD COLUMN "current_speed" INTEGER NOT NULL DEFAULT 0;

UPDATE "system_values"
SET
	"core_key" = 'health_points',
	"is_system_managed" = true
WHERE "slug" = 'zdorovye' OR "name" = 'Здоровье';

UPDATE "system_values"
SET
	"core_key" = 'action_points',
	"is_system_managed" = true
WHERE "name" = 'Потенциал';

INSERT INTO "system_values" (
	"id",
	"slug",
	"name",
	"description",
	"primary_owner_type",
	"primary_owner_id",
	"core_key",
	"display_section",
	"calculation_graph",
	"is_system_managed",
	"is_active",
	"sort_order",
	"created_at",
	"updated_at"
)
VALUES (
	'00000000-0000-0000-0000-000000000103',
	'speed',
	'Скорость',
	'Базовая скорость персонажа. Используется боевым столкновением как снимок текущей скорости.',
	'MANUAL',
	NULL,
	'speed',
	'Ресурсы персонажа',
	'{"nodes":[{"id":"character-input","kind":"characterInput","x":120,"y":120},{"id":"result","kind":"result","x":420,"y":120}],"edges":[{"id":"character-input:out -> result:in","source":"character-input","target":"result","sourceHandle":"out","targetHandle":"in"}]}'::jsonb,
	true,
	true,
	3,
	CURRENT_TIMESTAMP,
	CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO UPDATE
SET
	"core_key" = EXCLUDED."core_key",
	"is_system_managed" = true,
	"display_section" = COALESCE("system_values"."display_section", EXCLUDED."display_section"),
	"calculation_graph" = COALESCE("system_values"."calculation_graph", EXCLUDED."calculation_graph");
