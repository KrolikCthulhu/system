-- CreateTable
CREATE TABLE "attributes" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characteristics" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "attribute_id" UUID NOT NULL,
    "description" TEXT,
    "min_value" INTEGER NOT NULL DEFAULT 0,
    "max_value" INTEGER NOT NULL DEFAULT 10,
    "default_value" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characteristics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attributes_is_active_sort_order_idx" ON "attributes"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "characteristics_attribute_id_idx" ON "characteristics"("attribute_id");

-- CreateIndex
CREATE INDEX "characteristics_attribute_id_is_active_sort_order_idx" ON "characteristics"("attribute_id", "is_active", "sort_order");

-- AddForeignKey
ALTER TABLE "characteristics" ADD CONSTRAINT "characteristics_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attributes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
