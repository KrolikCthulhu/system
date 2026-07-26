ALTER TABLE "conditions" ADD COLUMN "instance_limit_mode" TEXT NOT NULL DEFAULT 'fixed';
ALTER TABLE "conditions" ADD COLUMN "instance_uniqueness_mode" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "conditions" ADD COLUMN "duplicate_instance_mode" TEXT NOT NULL DEFAULT 'update_existing';
