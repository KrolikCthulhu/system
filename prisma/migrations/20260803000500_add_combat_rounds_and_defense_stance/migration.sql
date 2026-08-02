ALTER TABLE "combat_encounters"
ADD COLUMN "current_round" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "combat_encounter_participants"
ADD COLUMN "defense_stance_round" INTEGER;

ALTER TABLE "system_combat_actions"
ADD COLUMN "confirmation_title" TEXT;

INSERT INTO "system_combat_actions" (
	"id",
	"core_key",
	"label",
	"description",
	"confirmation_title",
	"is_enabled",
	"sort_order",
	"created_at",
	"updated_at"
)
VALUES (
	gen_random_uuid(),
	'enter_defense_stance',
	'Перейти в оборону',
	'Откажитесь от активных действий до конца текущего раунда и сохраните оставшийся Потенциал для защитных реакций.',
	'Перейти в оборону?',
	TRUE,
	10020,
	now(),
	now()
)
ON CONFLICT ("core_key") DO UPDATE
SET
	"label" = EXCLUDED."label",
	"description" = EXCLUDED."description",
	"confirmation_title" = EXCLUDED."confirmation_title",
	"updated_at" = now();
