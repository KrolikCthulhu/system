-- CreateEnum
CREATE TYPE "SystemValueBaseSourceType" AS ENUM ('CHARACTER_INPUT', 'COMPUTED');

-- AlterTable
ALTER TABLE "attributes" ADD COLUMN     "base_source_type" "SystemValueBaseSourceType" NOT NULL DEFAULT 'COMPUTED',
ADD COLUMN     "is_system_value" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "characteristics" ADD COLUMN     "base_source_type" "SystemValueBaseSourceType" NOT NULL DEFAULT 'CHARACTER_INPUT',
ADD COLUMN     "is_system_value" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "skills" ADD COLUMN     "base_source_type" "SystemValueBaseSourceType" NOT NULL DEFAULT 'CHARACTER_INPUT',
ADD COLUMN     "is_system_value" BOOLEAN NOT NULL DEFAULT true;
