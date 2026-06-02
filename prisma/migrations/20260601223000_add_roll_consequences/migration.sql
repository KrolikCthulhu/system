-- CreateTable
CREATE TABLE "roll_consequences" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roll_consequences_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "skills" ADD COLUMN "roll_consequence_id" UUID;

-- CreateIndex
CREATE INDEX "roll_consequences_is_active_sort_order_idx" ON "roll_consequences"("is_active", "sort_order");
CREATE INDEX "skills_roll_consequence_id_idx" ON "skills"("roll_consequence_id");

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_roll_consequence_id_fkey" FOREIGN KEY ("roll_consequence_id") REFERENCES "roll_consequences"("id") ON DELETE SET NULL ON UPDATE CASCADE;
