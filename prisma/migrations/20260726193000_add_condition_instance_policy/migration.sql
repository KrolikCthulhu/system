ALTER TABLE "conditions" ADD COLUMN "instance_mode" TEXT NOT NULL DEFAULT 'single';
ALTER TABLE "conditions" ADD COLUMN "max_instances" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "conditions" ADD COLUMN "instance_overflow_mode" TEXT NOT NULL DEFAULT 'reject_new';
