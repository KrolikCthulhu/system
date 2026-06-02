CREATE TABLE "character_sheet_sandbox_drafts" (
    "key" TEXT NOT NULL,
    "input_values" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_sheet_sandbox_drafts_pkey" PRIMARY KEY ("key")
);
