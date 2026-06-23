CREATE TABLE "magic_word_essence_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "magic_word_id" UUID NOT NULL,
    "damage_affinity" DECIMAL(5,4) NOT NULL DEFAULT 0.5,
    "range_affinity" DECIMAL(5,4) NOT NULL DEFAULT 0.5,
    "control_affinity" DECIMAL(5,4) NOT NULL DEFAULT 0.5,
    "duration_affinity" DECIMAL(5,4) NOT NULL DEFAULT 0.5,
    "area_affinity" DECIMAL(5,4) NOT NULL DEFAULT 0.5,
    "stability_affinity" DECIMAL(5,4) NOT NULL DEFAULT 0.5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "magic_word_essence_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "magic_word_essence_profiles_magic_word_id_key" ON "magic_word_essence_profiles"("magic_word_id");
CREATE INDEX "magic_word_essence_profiles_magic_word_id_idx" ON "magic_word_essence_profiles"("magic_word_id");

ALTER TABLE "magic_word_essence_profiles"
ADD CONSTRAINT "magic_word_essence_profiles_magic_word_id_fkey"
FOREIGN KEY ("magic_word_id") REFERENCES "magic_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;
