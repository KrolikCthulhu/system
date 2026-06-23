-- CreateEnum
CREATE TYPE "SpellMechanicActionKind" AS ENUM (
    'CHECK',
    'CALCULATION',
    'VALUE_CHANGE',
    'CONDITION_ADD',
    'CONDITION_REMOVE',
    'TEXT',
    'CUSTOM'
);

-- CreateTable
CREATE TABLE "spell_mechanic_actions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "mechanic_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "SpellMechanicActionKind" NOT NULL DEFAULT 'CUSTOM',
    "config" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spell_mechanic_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "spell_mechanic_actions_mechanic_id_sort_order_idx" ON "spell_mechanic_actions"("mechanic_id", "sort_order");

-- AddForeignKey
ALTER TABLE "spell_mechanic_actions" ADD CONSTRAINT "spell_mechanic_actions_mechanic_id_fkey" FOREIGN KEY ("mechanic_id") REFERENCES "spell_mechanics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
