-- Convert character-input system values to explicit graph source nodes.
UPDATE "system_values"
SET "calculation_graph" = jsonb_build_object(
    'nodes',
    jsonb_build_array(
        jsonb_build_object(
            'id', 'character-input',
            'kind', 'characterInput',
            'x', 120,
            'y', 120
        ),
        jsonb_build_object(
            'id', 'result',
            'kind', 'result',
            'x', 420,
            'y', 120
        )
    ),
    'edges',
    jsonb_build_array(
        jsonb_build_object(
            'id', 'character-input:out -> result:in',
            'source', 'character-input',
            'target', 'result',
            'sourceHandle', 'out',
            'targetHandle', 'in'
        )
    )
)
WHERE "base_source_type" = 'CHARACTER_INPUT';

-- Computed values without a graph still need a valid result node.
UPDATE "system_values"
SET "calculation_graph" = jsonb_build_object(
    'nodes',
    jsonb_build_array(
        jsonb_build_object(
            'id', 'result',
            'kind', 'result',
            'x', 420,
            'y', 180
        )
    ),
    'edges',
    jsonb_build_array()
)
WHERE "base_source_type" = 'COMPUTED'
  AND "calculation_graph" IS NULL;

-- Drop the old mode column and enum. Value source is now represented by graph nodes.
ALTER TABLE "system_values" DROP COLUMN "base_source_type";
DROP TYPE "SystemValueBaseSourceType";
