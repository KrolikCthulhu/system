CREATE TABLE "combat_encounter_defense_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "encounter_id" UUID NOT NULL,
    "actor_participant_id" UUID NOT NULL,
    "target_participant_id" UUID NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "action_slug" TEXT NOT NULL,
    "action_snapshot" JSONB NOT NULL,
    "attack_roll" JSONB NOT NULL,
    "defense_options" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolved_by_user_id" UUID,
    "resolved_at" TIMESTAMP(3),
    "resolution" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combat_encounter_defense_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "combat_encounter_defense_requests_encounter_id_status_created_at_idx" ON "combat_encounter_defense_requests"("encounter_id", "status", "created_at");
CREATE INDEX "combat_encounter_defense_requests_target_participant_id_status_idx" ON "combat_encounter_defense_requests"("target_participant_id", "status");
CREATE INDEX "combat_encounter_defense_requests_actor_participant_id_idx" ON "combat_encounter_defense_requests"("actor_participant_id");

ALTER TABLE "combat_encounter_defense_requests" ADD CONSTRAINT "combat_encounter_defense_requests_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "combat_encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "combat_encounter_defense_requests" ADD CONSTRAINT "combat_encounter_defense_requests_actor_participant_id_fkey" FOREIGN KEY ("actor_participant_id") REFERENCES "combat_encounter_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "combat_encounter_defense_requests" ADD CONSTRAINT "combat_encounter_defense_requests_target_participant_id_fkey" FOREIGN KEY ("target_participant_id") REFERENCES "combat_encounter_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
