-- CreateEnum
CREATE TYPE "SystemValueOwnerType" AS ENUM ('ATTRIBUTE', 'CHARACTERISTIC', 'SKILL', 'ROLL_CONSEQUENCE', 'MANUAL');

-- CreateTable
CREATE TABLE "system_values" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "primary_owner_type" "SystemValueOwnerType" NOT NULL,
    "primary_owner_id" UUID,
    "base_source_type" "SystemValueBaseSourceType" NOT NULL DEFAULT 'CHARACTER_INPUT',
    "calculation_graph" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_value_links" (
    "id" UUID NOT NULL,
    "system_value_id" UUID NOT NULL,
    "target_type" "SystemValueOwnerType" NOT NULL,
    "target_id" UUID,
    "label" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_value_links_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "attributes" ADD COLUMN "system_value_id" UUID;
ALTER TABLE "characteristics" ADD COLUMN "system_value_id" UUID;
ALTER TABLE "skills" ADD COLUMN "system_value_id" UUID;

-- Backfill existing primary-owned values. The ids are intentionally preserved
-- to keep existing value graph references stable during the first migration step.
INSERT INTO "system_values" (
    "id",
    "name",
    "description",
    "primary_owner_type",
    "primary_owner_id",
    "base_source_type",
    "calculation_graph",
    "is_active",
    "sort_order",
    "created_at",
    "updated_at"
)
SELECT
    "id",
    "name",
    "description",
    'ATTRIBUTE'::"SystemValueOwnerType",
    "id",
    "base_source_type",
    "calculation_graph",
    "is_active",
    "sort_order",
    "created_at",
    "updated_at"
FROM "attributes"
WHERE "is_system_value" = true;

INSERT INTO "system_values" (
    "id",
    "name",
    "description",
    "primary_owner_type",
    "primary_owner_id",
    "base_source_type",
    "calculation_graph",
    "is_active",
    "sort_order",
    "created_at",
    "updated_at"
)
SELECT
    "id",
    "name",
    "description",
    'CHARACTERISTIC'::"SystemValueOwnerType",
    "id",
    "base_source_type",
    "calculation_graph",
    "is_active",
    "sort_order",
    "created_at",
    "updated_at"
FROM "characteristics"
WHERE "is_system_value" = true;

INSERT INTO "system_values" (
    "id",
    "name",
    "description",
    "primary_owner_type",
    "primary_owner_id",
    "base_source_type",
    "calculation_graph",
    "is_active",
    "sort_order",
    "created_at",
    "updated_at"
)
SELECT
    "id",
    "name",
    "description",
    'SKILL'::"SystemValueOwnerType",
    "id",
    "base_source_type",
    "calculation_graph",
    "is_active",
    "sort_order",
    "created_at",
    "updated_at"
FROM "skills"
WHERE "is_system_value" = true;

UPDATE "attributes"
SET "system_value_id" = "id"
WHERE "is_system_value" = true;

UPDATE "characteristics"
SET "system_value_id" = "id"
WHERE "is_system_value" = true;

UPDATE "skills"
SET "system_value_id" = "id"
WHERE "is_system_value" = true;

INSERT INTO "system_value_links" (
    "id",
    "system_value_id",
    "target_type",
    "target_id",
    "sort_order",
    "created_at",
    "updated_at"
)
SELECT
    "system_value_id",
    "system_value_id",
    'ATTRIBUTE'::"SystemValueOwnerType",
    "id",
    "sort_order",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "attributes"
WHERE "system_value_id" IS NOT NULL;

INSERT INTO "system_value_links" (
    "id",
    "system_value_id",
    "target_type",
    "target_id",
    "sort_order",
    "created_at",
    "updated_at"
)
SELECT
    "system_value_id",
    "system_value_id",
    'CHARACTERISTIC'::"SystemValueOwnerType",
    "id",
    "sort_order",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "characteristics"
WHERE "system_value_id" IS NOT NULL;

INSERT INTO "system_value_links" (
    "id",
    "system_value_id",
    "target_type",
    "target_id",
    "sort_order",
    "created_at",
    "updated_at"
)
SELECT
    "system_value_id",
    "system_value_id",
    'SKILL'::"SystemValueOwnerType",
    "id",
    "sort_order",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "skills"
WHERE "system_value_id" IS NOT NULL;

-- CreateIndex
CREATE INDEX "system_values_primary_owner_type_primary_owner_id_idx" ON "system_values"("primary_owner_type", "primary_owner_id");
CREATE INDEX "system_values_is_active_sort_order_idx" ON "system_values"("is_active", "sort_order");
CREATE UNIQUE INDEX "system_value_links_system_value_id_target_type_target_id_key" ON "system_value_links"("system_value_id", "target_type", "target_id");
CREATE INDEX "system_value_links_target_type_target_id_idx" ON "system_value_links"("target_type", "target_id");
CREATE INDEX "system_value_links_system_value_id_idx" ON "system_value_links"("system_value_id");
CREATE UNIQUE INDEX "attributes_system_value_id_key" ON "attributes"("system_value_id");
CREATE UNIQUE INDEX "characteristics_system_value_id_key" ON "characteristics"("system_value_id");
CREATE UNIQUE INDEX "skills_system_value_id_key" ON "skills"("system_value_id");

-- AddForeignKey
ALTER TABLE "system_value_links" ADD CONSTRAINT "system_value_links_system_value_id_fkey" FOREIGN KEY ("system_value_id") REFERENCES "system_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attributes" ADD CONSTRAINT "attributes_system_value_id_fkey" FOREIGN KEY ("system_value_id") REFERENCES "system_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "characteristics" ADD CONSTRAINT "characteristics_system_value_id_fkey" FOREIGN KEY ("system_value_id") REFERENCES "system_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "skills" ADD CONSTRAINT "skills_system_value_id_fkey" FOREIGN KEY ("system_value_id") REFERENCES "system_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;
