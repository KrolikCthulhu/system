-- CreateEnum
CREATE TYPE "SpellMechanicNumericRole" AS ENUM ('DAMAGE', 'RANGE', 'DURATION', 'AREA', 'TARGET_COUNT', 'CUSTOM');

-- AlterTable
ALTER TABLE "spell_mechanic_parameters" ADD COLUMN     "numeric_role" "SpellMechanicNumericRole" NOT NULL DEFAULT 'CUSTOM';
