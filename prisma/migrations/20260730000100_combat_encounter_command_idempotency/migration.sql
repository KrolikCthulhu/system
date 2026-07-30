-- CreateTable
CREATE TABLE "combat_encounter_commands" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "encounter_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "request_id" TEXT NOT NULL,
    "command_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combat_encounter_commands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "combat_encounter_commands_encounter_id_user_id_request_id_key" ON "combat_encounter_commands"("encounter_id", "user_id", "request_id");

-- CreateIndex
CREATE INDEX "combat_encounter_commands_encounter_id_command_type_created_at_idx" ON "combat_encounter_commands"("encounter_id", "command_type", "created_at");

-- CreateIndex
CREATE INDEX "combat_encounter_commands_user_id_created_at_idx" ON "combat_encounter_commands"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "combat_encounter_commands" ADD CONSTRAINT "combat_encounter_commands_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "combat_encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combat_encounter_commands" ADD CONSTRAINT "combat_encounter_commands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
