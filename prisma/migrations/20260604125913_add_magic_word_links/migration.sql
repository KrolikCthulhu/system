-- CreateTable
CREATE TABLE "magic_word_skill_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "magic_word_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magic_word_skill_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "magic_word_skill_links_magic_word_id_idx" ON "magic_word_skill_links"("magic_word_id");

-- CreateIndex
CREATE INDEX "magic_word_skill_links_skill_id_idx" ON "magic_word_skill_links"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "magic_word_skill_links_magic_word_id_skill_id_key" ON "magic_word_skill_links"("magic_word_id", "skill_id");

-- AddForeignKey
ALTER TABLE "magic_word_skill_links" ADD CONSTRAINT "magic_word_skill_links_magic_word_id_fkey" FOREIGN KEY ("magic_word_id") REFERENCES "magic_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "magic_word_skill_links" ADD CONSTRAINT "magic_word_skill_links_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
