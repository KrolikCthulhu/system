DO $$
BEGIN
    IF to_regclass('public.combat_encounter_condition_links') IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conrelid = 'public.combat_encounter_condition_links'::regclass
                AND conname = 'combat_encounter_condition_links_source_condition_instance_id_f'
        )
        AND NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conrelid = 'public.combat_encounter_condition_links'::regclass
                AND conname = 'combat_encounter_condition_links_source_condition_instance_fkey'
        )
    THEN
        ALTER TABLE "combat_encounter_condition_links" RENAME CONSTRAINT "combat_encounter_condition_links_source_condition_instance_id_f" TO "combat_encounter_condition_links_source_condition_instance_fkey";
    END IF;

    IF to_regclass('public.combat_encounter_condition_links') IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conrelid = 'public.combat_encounter_condition_links'::regclass
                AND conname = 'combat_encounter_condition_links_target_condition_instance_id_f'
        )
        AND NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conrelid = 'public.combat_encounter_condition_links'::regclass
                AND conname = 'combat_encounter_condition_links_target_condition_instance_fkey'
        )
    THEN
        ALTER TABLE "combat_encounter_condition_links" RENAME CONSTRAINT "combat_encounter_condition_links_target_condition_instance_id_f" TO "combat_encounter_condition_links_target_condition_instance_fkey";
    END IF;

    IF to_regclass('public.combat_encounter_condition_links_source_participant_id_is_activ') IS NOT NULL
        AND to_regclass('public.combat_encounter_condition_links_source_participant_id_is_a_idx') IS NULL
    THEN
        ALTER INDEX "combat_encounter_condition_links_source_participant_id_is_activ" RENAME TO "combat_encounter_condition_links_source_participant_id_is_a_idx";
    END IF;

    IF to_regclass('public.combat_encounter_condition_links_target_participant_id_is_activ') IS NOT NULL
        AND to_regclass('public.combat_encounter_condition_links_target_participant_id_is_a_idx') IS NULL
    THEN
        ALTER INDEX "combat_encounter_condition_links_target_participant_id_is_activ" RENAME TO "combat_encounter_condition_links_target_participant_id_is_a_idx";
    END IF;

    IF to_regclass('public.combat_encounter_defense_requests_encounter_id_status_created_a') IS NOT NULL
        AND to_regclass('public.combat_encounter_defense_requests_encounter_id_status_creat_idx') IS NULL
    THEN
        ALTER INDEX "combat_encounter_defense_requests_encounter_id_status_created_a" RENAME TO "combat_encounter_defense_requests_encounter_id_status_creat_idx";
    END IF;

    IF to_regclass('public.combat_encounter_defense_requests_target_participant_id_status_') IS NOT NULL
        AND to_regclass('public.combat_encounter_defense_requests_target_participant_id_sta_idx') IS NULL
    THEN
        ALTER INDEX "combat_encounter_defense_requests_target_participant_id_status_" RENAME TO "combat_encounter_defense_requests_target_participant_id_sta_idx";
    END IF;

    IF to_regclass('public.combat_encounter_participant_conditions_encounter_id_participan') IS NOT NULL
        AND to_regclass('public.combat_encounter_participant_conditions_encounter_id_partic_idx') IS NULL
    THEN
        ALTER INDEX "combat_encounter_participant_conditions_encounter_id_participan" RENAME TO "combat_encounter_participant_conditions_encounter_id_partic_idx";
    END IF;

    IF to_regclass('public.combat_encounter_participant_conditions_source_participant_id_i') IS NOT NULL
        AND to_regclass('public.combat_encounter_participant_conditions_source_participant__idx') IS NULL
    THEN
        ALTER INDEX "combat_encounter_participant_conditions_source_participant_id_i" RENAME TO "combat_encounter_participant_conditions_source_participant__idx";
    END IF;

    IF to_regclass('public.natural_attack_profile_damage_types_profile_id_damage_type_id_k') IS NOT NULL
        AND to_regclass('public.natural_attack_profile_damage_types_profile_id_damage_type__key') IS NULL
    THEN
        ALTER INDEX "natural_attack_profile_damage_types_profile_id_damage_type_id_k" RENAME TO "natural_attack_profile_damage_types_profile_id_damage_type__key";
    END IF;
END $$;
