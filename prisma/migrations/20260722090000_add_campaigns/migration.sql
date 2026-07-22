CREATE TYPE "CampaignMemberRole" AS ENUM ('GM', 'PLAYER');

CREATE TYPE "CampaignMemberStatus" AS ENUM ('INVITED', 'ACTIVE', 'LEFT');

CREATE TABLE "campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "campaign_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "CampaignMemberRole" NOT NULL DEFAULT 'PLAYER',
    "status" "CampaignMemberStatus" NOT NULL DEFAULT 'INVITED',
    "invited_by_id" UUID,
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joined_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_members_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "campaigns_owner_id_idx" ON "campaigns"("owner_id");

CREATE INDEX "campaigns_is_active_updated_at_idx" ON "campaigns"("is_active", "updated_at");

CREATE UNIQUE INDEX "campaign_members_campaign_id_user_id_key" ON "campaign_members"("campaign_id", "user_id");

CREATE INDEX "campaign_members_user_id_idx" ON "campaign_members"("user_id");

CREATE INDEX "campaign_members_campaign_id_status_idx" ON "campaign_members"("campaign_id", "status");

ALTER TABLE "campaigns"
    ADD CONSTRAINT "campaigns_owner_id_fkey"
    FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "campaign_members"
    ADD CONSTRAINT "campaign_members_campaign_id_fkey"
    FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "campaign_members"
    ADD CONSTRAINT "campaign_members_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
