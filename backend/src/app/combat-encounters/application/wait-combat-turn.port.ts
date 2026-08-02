import { CombatEncounterReadModel } from './combat-encounter.read-model';

export const WAIT_COMBAT_TURN_INFRASTRUCTURE = Symbol(
	'WAIT_COMBAT_TURN_INFRASTRUCTURE'
);

export interface WaitCombatTurnInfrastructurePort {
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
	recordInitiativeWaited(input: {
		encounterId: string;
		participantId: string;
		targetParticipantId: string;
		userId: string;
		participantName: string;
		targetParticipantName: string;
		fromPotential: number;
		toPotential: number;
		potentialCost: number;
	}): Promise<void>;
	publishAndReturnEncounter(
		encounterId: string,
		userId: string
	): Promise<unknown>;
}
