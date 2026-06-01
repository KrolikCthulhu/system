-- Ensure every current owner points to a primary-owned system value before
-- making the relationship mandatory and dropping legacy calculation columns.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "attributes" WHERE "system_value_id" IS NULL) THEN
        RAISE EXCEPTION 'Cannot remove legacy fields: attributes.system_value_id contains NULL values.';
    END IF;

    IF EXISTS (SELECT 1 FROM "characteristics" WHERE "system_value_id" IS NULL) THEN
        RAISE EXCEPTION 'Cannot remove legacy fields: characteristics.system_value_id contains NULL values.';
    END IF;

    IF EXISTS (SELECT 1 FROM "skills" WHERE "system_value_id" IS NULL) THEN
        RAISE EXCEPTION 'Cannot remove legacy fields: skills.system_value_id contains NULL values.';
    END IF;
END $$;

-- DropForeignKey
ALTER TABLE "attributes" DROP CONSTRAINT "attributes_system_value_id_fkey";
ALTER TABLE "characteristics" DROP CONSTRAINT "characteristics_system_value_id_fkey";
ALTER TABLE "skills" DROP CONSTRAINT "skills_system_value_id_fkey";

-- AlterTable
ALTER TABLE "attributes"
    ALTER COLUMN "system_value_id" SET NOT NULL,
    DROP COLUMN "is_system_value",
    DROP COLUMN "base_source_type",
    DROP COLUMN "calculation_graph";

ALTER TABLE "characteristics"
    ALTER COLUMN "system_value_id" SET NOT NULL,
    DROP COLUMN "is_system_value",
    DROP COLUMN "base_source_type",
    DROP COLUMN "calculation_graph";

ALTER TABLE "skills"
    ALTER COLUMN "system_value_id" SET NOT NULL,
    DROP COLUMN "is_system_value",
    DROP COLUMN "base_source_type",
    DROP COLUMN "calculation_graph";

-- AddForeignKey
ALTER TABLE "attributes" ADD CONSTRAINT "attributes_system_value_id_fkey" FOREIGN KEY ("system_value_id") REFERENCES "system_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "characteristics" ADD CONSTRAINT "characteristics_system_value_id_fkey" FOREIGN KEY ("system_value_id") REFERENCES "system_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "skills" ADD CONSTRAINT "skills_system_value_id_fkey" FOREIGN KEY ("system_value_id") REFERENCES "system_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
