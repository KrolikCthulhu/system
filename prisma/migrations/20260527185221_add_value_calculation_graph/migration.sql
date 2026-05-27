-- AlterTable
ALTER TABLE "attributes" ADD COLUMN     "calculation_graph" JSONB;

-- AlterTable
ALTER TABLE "characteristics" ADD COLUMN     "calculation_graph" JSONB;

-- AlterTable
ALTER TABLE "skills" ADD COLUMN     "calculation_graph" JSONB;
