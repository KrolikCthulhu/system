DO $$
BEGIN
    IF to_regclass('public.combat_encounter_declared_actions_actor_participant_id_status_i') IS NOT NULL
        AND to_regclass('public.combat_encounter_declared_actions_actor_participant_id_stat_idx') IS NULL
    THEN
        ALTER INDEX "combat_encounter_declared_actions_actor_participant_id_status_i" RENAME TO "combat_encounter_declared_actions_actor_participant_id_stat_idx";
    END IF;

    IF to_regclass('public.combat_encounter_declared_actions_encounter_id_status_resolve_i') IS NOT NULL
        AND to_regclass('public.combat_encounter_declared_actions_encounter_id_status_resol_idx') IS NULL
    THEN
        ALTER INDEX "combat_encounter_declared_actions_encounter_id_status_resolve_i" RENAME TO "combat_encounter_declared_actions_encounter_id_status_resol_idx";
    END IF;

    IF to_regclass('public.combat_encounter_declared_actions_target_participant_id_status_') IS NOT NULL
        AND to_regclass('public.combat_encounter_declared_actions_target_participant_id_sta_idx') IS NULL
    THEN
        ALTER INDEX "combat_encounter_declared_actions_target_participant_id_status_" RENAME TO "combat_encounter_declared_actions_target_participant_id_sta_idx";
    END IF;
END $$;
