CREATE TYPE "PlayerCharacterStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

CREATE TABLE "player_characters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "PlayerCharacterStatus" NOT NULL DEFAULT 'DRAFT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_characters_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "player_characters_campaign_id_status_idx" ON "player_characters"("campaign_id", "status");

CREATE INDEX "player_characters_owner_user_id_idx" ON "player_characters"("owner_user_id");

CREATE INDEX "player_characters_campaign_id_owner_user_id_idx" ON "player_characters"("campaign_id", "owner_user_id");

ALTER TABLE "player_characters"
    ADD CONSTRAINT "player_characters_campaign_id_fkey"
    FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "player_characters"
    ADD CONSTRAINT "player_characters_owner_user_id_fkey"
    FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
