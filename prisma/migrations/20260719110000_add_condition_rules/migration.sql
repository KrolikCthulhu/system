ALTER TABLE "conditions"
ADD COLUMN "duration_type" TEXT NOT NULL DEFAULT 'until_action_end',
ADD COLUMN "stack_mode" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN "max_level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "removal_methods" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "effects" JSONB NOT NULL DEFAULT '[]';

CREATE INDEX "conditions_duration_type_is_active_sort_order_idx"
ON "conditions"("duration_type", "is_active", "sort_order");
