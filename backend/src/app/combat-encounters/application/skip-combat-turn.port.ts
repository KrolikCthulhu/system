import { CombatEncounterPolicyParticipant } from '../combat-encounter-policy.service';
import { CombatEncounterStatus } from '../domain/combat-encounter.types';

export const SKIP_COMBAT_TURN_INFRASTRUCTURE = Symbol(
	'SKIP_COMBAT_TURN_INFRASTRUCTURE'
);

export interface SkipCombatTurnParticipant
	extends CombatEncounterPolicyParticipant {
	id: string;
	isActive: boolean;
	currentPotential: number;
	sortOrder: number;
	sceneName: string;
}

export interface SkipCombatTurnEncounter {
	id: string;
	campaignId: string;
	status: CombatEncounterStatus;
	campaign: {
		combatActionResolutionMode: string;
	};
	participants: SkipCombatTurnParticipant[];
	declaredActions: Array<{
		status: string;
		resolveAtPotential: number;
	}>;
}

export interface SkipCombatTurnInfrastructurePort {
	findEncounter(id: string): Promise<SkipCombatTurnEncounter>;
	runIdempotentCombatCommand(
		encounterId: string,
		userId: string,
		requestId: string,
		expectedVersion: number,
		commandType: string,
		rateLimitOptions: undefined,
		execute: () => Promise<unknown>
	): Promise<unknown>;
	recordTurnSkipped(input: {
		encounterId: string;
		participantId: string;
		userId: string;
		participantName: string;
		fromPotential: number;
		toPotential: number;
	}): Promise<void>;
	publishAndReturnEncounter(
		encounterId: string,
		userId: string
	): Promise<unknown>;
}
