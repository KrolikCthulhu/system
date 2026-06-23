CREATE TABLE "spell_mechanic_blocks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "spell_id" UUID NOT NULL,
    "mechanic_id" UUID NOT NULL,
    "parameter_values" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spell_mechanic_blocks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "spell_mechanic_blocks_spell_id_sort_order_idx" ON "spell_mechanic_blocks"("spell_id", "sort_order");
CREATE INDEX "spell_mechanic_blocks_mechanic_id_idx" ON "spell_mechanic_blocks"("mechanic_id");

ALTER TABLE "spell_mechanic_blocks"
    ADD CONSTRAINT "spell_mechanic_blocks_spell_id_fkey"
    FOREIGN KEY ("spell_id") REFERENCES "spells"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "spell_mechanic_blocks"
    ADD CONSTRAINT "spell_mechanic_blocks_mechanic_id_fkey"
    FOREIGN KEY ("mechanic_id") REFERENCES "spell_mechanics"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
