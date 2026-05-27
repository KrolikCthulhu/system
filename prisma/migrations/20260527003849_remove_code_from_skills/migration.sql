/*
  Warnings:

  - You are about to drop the column `code` on the `skill_categories` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `skills` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "skill_categories_code_key";

-- DropIndex
DROP INDEX "skills_code_key";

-- AlterTable
ALTER TABLE "skill_categories" DROP COLUMN "code";

-- AlterTable
ALTER TABLE "skills" DROP COLUMN "code";
