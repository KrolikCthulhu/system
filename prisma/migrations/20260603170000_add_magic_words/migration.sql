-- CreateEnum
CREATE TYPE "MagicWordType" AS ENUM ('ACTION', 'ESSENCE', 'GESTURE', 'MODIFIER');

-- CreateTable
CREATE TABLE "magic_words" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "MagicWordType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "magic_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magic_word_gesture_restrictions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "modifier_id" UUID NOT NULL,
    "gesture_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magic_word_gesture_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "magic_words_type_name_key" ON "magic_words"("type", "name");

-- CreateIndex
CREATE INDEX "magic_words_type_is_active_sort_order_idx" ON "magic_words"("type", "is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "magic_word_gesture_restrictions_modifier_id_gesture_id_key" ON "magic_word_gesture_restrictions"("modifier_id", "gesture_id");

-- CreateIndex
CREATE INDEX "magic_word_gesture_restrictions_modifier_id_idx" ON "magic_word_gesture_restrictions"("modifier_id");

-- CreateIndex
CREATE INDEX "magic_word_gesture_restrictions_gesture_id_idx" ON "magic_word_gesture_restrictions"("gesture_id");

-- AddForeignKey
ALTER TABLE "magic_word_gesture_restrictions" ADD CONSTRAINT "magic_word_gesture_restrictions_modifier_id_fkey" FOREIGN KEY ("modifier_id") REFERENCES "magic_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magic_word_gesture_restrictions" ADD CONSTRAINT "magic_word_gesture_restrictions_gesture_id_fkey" FOREIGN KEY ("gesture_id") REFERENCES "magic_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;
