import {
	CombatEncounterReadModel,
	CombatEncounterSummaryReadModel
} from './combat-encounter.read-model';
import { UpdateCombatEncounterDto } from '../dto/update-combat-encounter.dto';

export const COMBAT_ENCOUNTER_REPOSITORY = Symbol(
	'COMBAT_ENCOUNTER_REPOSITORY'
);

export interface CombatEncounterRepositoryPort {
	findActiveSummariesByCampaign(
		campaignId: string
	): Promise<CombatEncounterSummaryReadModel[]>;
	createDraft(input: {
		campaignId: string;
		name: string;
	}): Promise<CombatEncounterReadModel>;
	updateStatus(id: string, dto: UpdateCombatEncounterDto): Promise<unknown>;
	advanceRoundIfNeeded(id: string): Promise<boolean>;
	incrementStateVersion(id: string): Promise<unknown>;
	findActiveById(id: string): Promise<CombatEncounterReadModel>;
}
