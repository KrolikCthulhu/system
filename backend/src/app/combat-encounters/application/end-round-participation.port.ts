import { CombatEncounterReadModel } from './combat-encounter.read-model';

export const END_ROUND_PARTICIPATION_INFRASTRUCTURE = Symbol(
	'END_ROUND_PARTICIPATION_INFRASTRUCTURE'
);

export interface EndRoundParticipationInfrastructurePort {
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
	recordRoundParticipationEnded(input: {
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
