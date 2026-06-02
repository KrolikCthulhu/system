CREATE TABLE "game_event_handlers" (
    "id" UUID NOT NULL,
    "event_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "graph" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_event_handlers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "game_event_handlers_event_type_is_active_sort_order_idx" ON "game_event_handlers"("event_type", "is_active", "sort_order");
