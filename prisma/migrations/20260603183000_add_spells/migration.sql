-- CreateEnum
CREATE TYPE "SpellStatus" AS ENUM ('DRAFT', 'TESTING', 'READY');

-- CreateTable
CREATE TABLE "spells" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "action_id" UUID NOT NULL,
    "essence_id" UUID NOT NULL,
    "gesture_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "SpellStatus" NOT NULL DEFAULT 'DRAFT',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spells_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "spells_action_id_essence_id_gesture_id_key" ON "spells"("action_id", "essence_id", "gesture_id");

-- CreateIndex
CREATE INDEX "spells_status_is_active_sort_order_idx" ON "spells"("status", "is_active", "sort_order");

-- CreateIndex
CREATE INDEX "spells_action_id_idx" ON "spells"("action_id");

-- CreateIndex
CREATE INDEX "spells_essence_id_idx" ON "spells"("essence_id");

-- CreateIndex
CREATE INDEX "spells_gesture_id_idx" ON "spells"("gesture_id");

-- AddForeignKey
ALTER TABLE "spells" ADD CONSTRAINT "spells_action_id_fkey" FOREIGN KEY ("action_id") REFERENCES "magic_words"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spells" ADD CONSTRAINT "spells_essence_id_fkey" FOREIGN KEY ("essence_id") REFERENCES "magic_words"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spells" ADD CONSTRAINT "spells_gesture_id_fkey" FOREIGN KEY ("gesture_id") REFERENCES "magic_words"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
