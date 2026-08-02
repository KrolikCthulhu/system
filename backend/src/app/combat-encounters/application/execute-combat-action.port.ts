import { RuntimeAction } from '../domain/combat-encounter-runtime.types';
import {
	CombatEncounterReadModel,
	JsonValue
} from './combat-encounter.read-model';

export const EXECUTE_COMBAT_ACTION_INFRASTRUCTURE = Symbol(
	'EXECUTE_COMBAT_ACTION_INFRASTRUCTURE'
);

export type ExecuteCombatActionEncounter = CombatEncounterReadModel;

export interface ExecuteCombatActionActor {
	id: string;
	encounterId: string;
	currentPotential: number;
	creature: { actions: JsonValue } | null;
	creatureTier: {
		actions: JsonValue;
		actionOverrides: JsonValue;
	} | null;
}

export interface ExecuteCombatActionInfrastructurePort {
	findEncounter(id: string): Promise<ExecuteCombatActionEncounter>;
	findActiveActor(input: {
		encounterId: string;
		actorParticipantId: string;
	}): Promise<ExecuteCombatActionActor | null>;
	assertEncounterParticipant(
		encounterId: string,
		participantId: string
	): Promise<void>;
	runIdempotentCombatCommand(
		encounterId: string,
		userId: string,
		requestId: string,
		expectedVersion: number,
		commandType: string,
		rateLimitOptions: undefined,
		execute: () => Promise<unknown>
	): Promise<unknown>;
	recordDeclaredAction(input: {
		encounterId: string;
		userId: string;
		actor: ExecuteCombatActionActor;
		targetParticipantId: string | null;
		action: RuntimeAction;
	}): Promise<void>;
	resolveActionNow(
		encounterId: string,
		userId: string,
		input: {
			actor: { id: string; currentPotential: number };
			targetParticipantId: string | null;
			action: RuntimeAction;
			declaredActionId?: string;
		}
	): Promise<void>;
	publishAndReturnEncounter(
		encounterId: string,
		userId: string
	): Promise<unknown>;
}
