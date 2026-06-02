-- Add attribute-level dice pool limit rules and skill roll characteristic binding.
ALTER TABLE "skills" ADD COLUMN "roll_characteristic_id" UUID;
ALTER TABLE "attributes" ADD COLUMN "pool_penalty_value_id" UUID;

CREATE INDEX "skills_roll_characteristic_id_idx" ON "skills"("roll_characteristic_id");
CREATE INDEX "attributes_pool_penalty_value_id_idx" ON "attributes"("pool_penalty_value_id");

DROP INDEX "skills_dice_pool_value_id_idx";

ALTER TABLE "skills" DROP CONSTRAINT "skills_dice_pool_value_id_fkey";
ALTER TABLE "skills" DROP COLUMN "dice_pool_value_id";

ALTER TABLE "skills"
	ADD CONSTRAINT "skills_roll_characteristic_id_fkey"
	FOREIGN KEY ("roll_characteristic_id") REFERENCES "characteristics"("id")
	ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "attributes"
	ADD CONSTRAINT "attributes_pool_penalty_value_id_fkey"
	FOREIGN KEY ("pool_penalty_value_id") REFERENCES "system_values"("id")
	ON DELETE SET NULL ON UPDATE CASCADE;
