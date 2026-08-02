ALTER TABLE "combat_encounter_participants"
ADD COLUMN "round_participation_ended_round" INTEGER;

INSERT INTO "system_combat_actions" (
	"id",
	"core_key",
	"label",
	"description",
	"target_choice_label",
	"confirmation_title",
	"option_label_template",
	"cost_label_template",
	"unavailable_text",
	"is_enabled",
	"sort_order",
	"created_at",
	"updated_at"
)
VALUES (
	gen_random_uuid(),
	'end_round_participation',
	'Завершить участие в раунде',
	'Участник выходит из очереди до следующего раунда и не сможет использовать оставшийся Потенциал на действия, защиты и реакции.',
	NULL,
	'Завершить участие в раунде?',
	NULL,
	NULL,
	'Участник уже завершил участие в этом раунде.',
	TRUE,
	10030,
	NOW(),
	NOW()
)
ON CONFLICT ("core_key") DO NOTHING;
