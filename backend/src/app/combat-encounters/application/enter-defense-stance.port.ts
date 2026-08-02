import { CombatEncounterReadModel } from './combat-encounter.read-model';

export const ENTER_DEFENSE_STANCE_INFRASTRUCTURE = Symbol(
	'ENTER_DEFENSE_STANCE_INFRASTRUCTURE'
);

export interface EnterDefenseStanceInfrastructurePort {
	findEncounter(id: string): Promise<CombatEncounterReadModel>;
	runIdempotentCombatCommand(
		encounterId: string,
		userId: string,
		requestId: string,
		expectedVersion: number,
		commandType: string,
		rateLimitOptions: undefined,
		execute: () => Promise<unknown>
	): Promise<unknown>;
	recordDefenseStanceEntered(input: {
		encounterId: string;
		participantId: string;
		userId: string;
		participantName: string;
		round: number;
		preservedPotential: number;
	}): Promise<void>;
	publishAndReturnEncounter(
		encounterId: string,
		userId: string
	): Promise<unknown>;
}
