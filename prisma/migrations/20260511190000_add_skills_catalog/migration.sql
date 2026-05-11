-- CreateTable
CREATE TABLE "skill_categories" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_levels" (
    "id" UUID NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "can_roll" BOOLEAN NOT NULL DEFAULT true,
    "success_min" INTEGER,
    "double_success_min" INTEGER,
    "ignore_ones_count" INTEGER NOT NULL DEFAULT 0,
    "expected_success_per_die" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "rule_text" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "category_id" UUID NOT NULL,
    "description" TEXT,
    "max_level" INTEGER NOT NULL DEFAULT 6,
    "default_level" INTEGER NOT NULL DEFAULT 0,
    "uses_default_level_rules" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skill_categories_code_key" ON "skill_categories"("code");

-- CreateIndex
CREATE INDEX "skill_categories_is_active_sort_order_idx" ON "skill_categories"("is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "skill_levels_level_key" ON "skill_levels"("level");

-- CreateIndex
CREATE INDEX "skill_levels_is_active_sort_order_idx" ON "skill_levels"("is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "skills_code_key" ON "skills"("code");

-- CreateIndex
CREATE INDEX "skills_category_id_idx" ON "skills"("category_id");

-- CreateIndex
CREATE INDEX "skills_category_id_is_active_sort_order_idx" ON "skills"("category_id", "is_active", "sort_order");

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "skill_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
