-- AlterTable
ALTER TABLE "skills" ADD COLUMN "dice_pool_value_id" UUID;

-- CreateIndex
CREATE INDEX "skills_dice_pool_value_id_idx" ON "skills"("dice_pool_value_id");

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_dice_pool_value_id_fkey" FOREIGN KEY ("dice_pool_value_id") REFERENCES "system_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;
