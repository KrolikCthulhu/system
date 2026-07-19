CREATE TYPE "AnatomyZoneKind" AS ENUM ('MAIN', 'TARGETED');

CREATE TABLE "anatomy_schemes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "anatomy_schemes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "anatomy_scheme_zones" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "scheme_id" UUID NOT NULL,
  "parent_id" UUID,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "AnatomyZoneKind" NOT NULL DEFAULT 'MAIN',
  "is_random_hit_eligible" BOOLEAN NOT NULL DEFAULT true,
  "random_hit_weight" INTEGER NOT NULL DEFAULT 1,
  "targeted_attack_dice_penalty" INTEGER NOT NULL DEFAULT 0,
  "extra_potential_cost" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "anatomy_scheme_zones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "creature_anatomy_zones" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "creature_id" UUID NOT NULL,
  "source_zone_id" UUID,
  "parent_id" UUID,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "AnatomyZoneKind" NOT NULL DEFAULT 'MAIN',
  "is_random_hit_eligible" BOOLEAN NOT NULL DEFAULT true,
  "random_hit_weight" INTEGER NOT NULL DEFAULT 1,
  "targeted_attack_dice_penalty" INTEGER NOT NULL DEFAULT 0,
  "extra_potential_cost" INTEGER NOT NULL DEFAULT 0,
  "is_inherited" BOOLEAN NOT NULL DEFAULT false,
  "is_removed" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "creature_anatomy_zones_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "creatures"
ADD COLUMN "anatomy_scheme_id" UUID;

CREATE UNIQUE INDEX "anatomy_schemes_slug_key" ON "anatomy_schemes"("slug");
CREATE UNIQUE INDEX "anatomy_schemes_name_key" ON "anatomy_schemes"("name");
CREATE INDEX "anatomy_schemes_is_active_sort_order_idx" ON "anatomy_schemes"("is_active", "sort_order");

CREATE UNIQUE INDEX "anatomy_scheme_zones_scheme_id_slug_key" ON "anatomy_scheme_zones"("scheme_id", "slug");
CREATE INDEX "anatomy_scheme_zones_scheme_id_sort_order_idx" ON "anatomy_scheme_zones"("scheme_id", "sort_order");
CREATE INDEX "anatomy_scheme_zones_parent_id_idx" ON "anatomy_scheme_zones"("parent_id");
CREATE INDEX "anatomy_scheme_zones_kind_is_active_sort_order_idx" ON "anatomy_scheme_zones"("kind", "is_active", "sort_order");

CREATE UNIQUE INDEX "creature_anatomy_zones_creature_id_slug_key" ON "creature_anatomy_zones"("creature_id", "slug");
CREATE INDEX "creature_anatomy_zones_creature_id_sort_order_idx" ON "creature_anatomy_zones"("creature_id", "sort_order");
CREATE INDEX "creature_anatomy_zones_source_zone_id_idx" ON "creature_anatomy_zones"("source_zone_id");
CREATE INDEX "creature_anatomy_zones_parent_id_idx" ON "creature_anatomy_zones"("parent_id");
CREATE INDEX "creature_anatomy_zones_kind_is_active_sort_order_idx" ON "creature_anatomy_zones"("kind", "is_active", "sort_order");
CREATE INDEX "creatures_anatomy_scheme_id_idx" ON "creatures"("anatomy_scheme_id");

ALTER TABLE "anatomy_scheme_zones"
ADD CONSTRAINT "anatomy_scheme_zones_scheme_id_fkey" FOREIGN KEY ("scheme_id") REFERENCES "anatomy_schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "anatomy_scheme_zones"
ADD CONSTRAINT "anatomy_scheme_zones_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "anatomy_scheme_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "creatures"
ADD CONSTRAINT "creatures_anatomy_scheme_id_fkey" FOREIGN KEY ("anatomy_scheme_id") REFERENCES "anatomy_schemes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "creature_anatomy_zones"
ADD CONSTRAINT "creature_anatomy_zones_creature_id_fkey" FOREIGN KEY ("creature_id") REFERENCES "creatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "creature_anatomy_zones"
ADD CONSTRAINT "creature_anatomy_zones_source_zone_id_fkey" FOREIGN KEY ("source_zone_id") REFERENCES "anatomy_scheme_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "creature_anatomy_zones"
ADD CONSTRAINT "creature_anatomy_zones_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "creature_anatomy_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
