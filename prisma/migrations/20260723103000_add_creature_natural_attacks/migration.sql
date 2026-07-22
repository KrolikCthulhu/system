CREATE TABLE "creature_natural_attacks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "creature_id" UUID NOT NULL,
    "natural_attack_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creature_natural_attacks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "creature_natural_attacks_creature_id_natural_attack_id_key" ON "creature_natural_attacks"("creature_id", "natural_attack_id");
CREATE INDEX "creature_natural_attacks_natural_attack_id_idx" ON "creature_natural_attacks"("natural_attack_id");
CREATE INDEX "creature_natural_attacks_creature_id_sort_order_idx" ON "creature_natural_attacks"("creature_id", "sort_order");

ALTER TABLE "creature_natural_attacks" ADD CONSTRAINT "creature_natural_attacks_creature_id_fkey" FOREIGN KEY ("creature_id") REFERENCES "creatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "creature_natural_attacks" ADD CONSTRAINT "creature_natural_attacks_natural_attack_id_fkey" FOREIGN KEY ("natural_attack_id") REFERENCES "natural_attacks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
