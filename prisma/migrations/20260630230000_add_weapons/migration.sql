CREATE TABLE "weapons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "skill_id" UUID NOT NULL,
    "extra_damage" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weapons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "weapons_slug_key" ON "weapons"("slug");

CREATE UNIQUE INDEX "weapons_name_key" ON "weapons"("name");

CREATE INDEX "weapons_skill_id_idx" ON "weapons"("skill_id");

CREATE INDEX "weapons_is_active_sort_order_idx" ON "weapons"("is_active", "sort_order");

ALTER TABLE "weapons" ADD CONSTRAINT "weapons_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
