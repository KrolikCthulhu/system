CREATE TABLE "combat_encounter_participant_conditions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "encounter_id" UUID NOT NULL,
    "participant_id" UUID NOT NULL,
    "condition_id" UUID NOT NULL,
    "display_name" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "source_participant_id" UUID,
    "source_action_slug" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combat_encounter_participant_conditions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "combat_encounter_condition_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "encounter_id" UUID NOT NULL,
    "source_participant_id" UUID NOT NULL,
    "target_participant_id" UUID NOT NULL,
    "source_condition_id" UUID NOT NULL,
    "target_condition_id" UUID NOT NULL,
    "source_condition_instance_id" UUID,
    "target_condition_instance_id" UUID,
    "source_action_slug" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combat_encounter_condition_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "combat_encounter_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "encounter_id" UUID NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "actor_participant_id" UUID,
    "target_participant_id" UUID,
    "type" TEXT NOT NULL,
    "action_slug" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combat_encounter_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "combat_encounter_participant_conditions_encounter_id_participant_id_is_active_idx" ON "combat_encounter_participant_conditions"("encounter_id", "participant_id", "is_active");
CREATE INDEX "combat_encounter_participant_conditions_condition_id_idx" ON "combat_encounter_participant_conditions"("condition_id");
CREATE INDEX "combat_encounter_participant_conditions_source_participant_id_idx" ON "combat_encounter_participant_conditions"("source_participant_id");

CREATE INDEX "combat_encounter_condition_links_encounter_id_is_active_idx" ON "combat_encounter_condition_links"("encounter_id", "is_active");
CREATE INDEX "combat_encounter_condition_links_source_participant_id_is_active_idx" ON "combat_encounter_condition_links"("source_participant_id", "is_active");
CREATE INDEX "combat_encounter_condition_links_target_participant_id_is_active_idx" ON "combat_encounter_condition_links"("target_participant_id", "is_active");
CREATE INDEX "combat_encounter_condition_links_source_condition_id_idx" ON "combat_encounter_condition_links"("source_condition_id");
CREATE INDEX "combat_encounter_condition_links_target_condition_id_idx" ON "combat_encounter_condition_links"("target_condition_id");

CREATE INDEX "combat_encounter_events_encounter_id_created_at_idx" ON "combat_encounter_events"("encounter_id", "created_at");
CREATE INDEX "combat_encounter_events_created_by_user_id_idx" ON "combat_encounter_events"("created_by_user_id");
CREATE INDEX "combat_encounter_events_actor_participant_id_idx" ON "combat_encounter_events"("actor_participant_id");
CREATE INDEX "combat_encounter_events_target_participant_id_idx" ON "combat_encounter_events"("target_participant_id");

ALTER TABLE "combat_encounter_participant_conditions" ADD CONSTRAINT "combat_encounter_participant_conditions_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "combat_encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "combat_encounter_participant_conditions" ADD CONSTRAINT "combat_encounter_participant_conditions_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "combat_encounter_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "combat_encounter_participant_conditions" ADD CONSTRAINT "combat_encounter_participant_conditions_condition_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "conditions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "combat_encounter_condition_links" ADD CONSTRAINT "combat_encounter_condition_links_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "combat_encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "combat_encounter_condition_links" ADD CONSTRAINT "combat_encounter_condition_links_source_participant_id_fkey" FOREIGN KEY ("source_participant_id") REFERENCES "combat_encounter_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "combat_encounter_condition_links" ADD CONSTRAINT "combat_encounter_condition_links_target_participant_id_fkey" FOREIGN KEY ("target_participant_id") REFERENCES "combat_encounter_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "combat_encounter_condition_links" ADD CONSTRAINT "combat_encounter_condition_links_source_condition_id_fkey" FOREIGN KEY ("source_condition_id") REFERENCES "conditions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "combat_encounter_condition_links" ADD CONSTRAINT "combat_encounter_condition_links_target_condition_id_fkey" FOREIGN KEY ("target_condition_id") REFERENCES "conditions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "combat_encounter_condition_links" ADD CONSTRAINT "combat_encounter_condition_links_source_condition_instance_id_fkey" FOREIGN KEY ("source_condition_instance_id") REFERENCES "combat_encounter_participant_conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "combat_encounter_condition_links" ADD CONSTRAINT "combat_encounter_condition_links_target_condition_instance_id_fkey" FOREIGN KEY ("target_condition_instance_id") REFERENCES "combat_encounter_participant_conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "combat_encounter_events" ADD CONSTRAINT "combat_encounter_events_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "combat_encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "combat_encounter_events" ADD CONSTRAINT "combat_encounter_events_actor_participant_id_fkey" FOREIGN KEY ("actor_participant_id") REFERENCES "combat_encounter_participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "combat_encounter_events" ADD CONSTRAINT "combat_encounter_events_target_participant_id_fkey" FOREIGN KEY ("target_participant_id") REFERENCES "combat_encounter_participants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
