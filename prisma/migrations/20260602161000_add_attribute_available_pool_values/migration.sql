-- Add read-only derived system values for available attribute dice pools.
ALTER TABLE "attributes" ADD COLUMN "available_pool_value_id" UUID;
ALTER TABLE "system_values" ADD COLUMN "is_system_managed" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "attributes_available_pool_value_id_key" ON "attributes"("available_pool_value_id");

ALTER TABLE "attributes"
	ADD CONSTRAINT "attributes_available_pool_value_id_fkey"
	FOREIGN KEY ("available_pool_value_id") REFERENCES "system_values"("id")
	ON DELETE SET NULL ON UPDATE CASCADE;
