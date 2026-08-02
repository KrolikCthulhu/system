import { RuntimeAction } from '../domain/combat-encounter-runtime.types';
import {
	CombatEncounterReadModel,
	JsonValue
} from './combat-encounter.read-model';

export const RESOLVE_DECLARED_COMBAT_ACTION_INFRASTRUCTURE = Symbol(
	'RESOLVE_DECLARED_COMBAT_ACTION_INFRASTRUCTURE'
);

export interface PendingDeclaredCombatAction {
	id: string;
	actorParticipantId: string;
	targetParticipantId: string | null;
	actionSlug: string;
	actionSnapshot: JsonValue;
	resolveAtPotential: number;
	actorParticipant: {
		id: string;
		encounterId: string;
		currentPotential: number;
	};
}

export interface ResolveDeclaredCombatActionInfrastructurePort {
	findEncounter(id: string): Promise<CombatEncounterReadModel>;
	findPendingDeclaredAction(input: {
		encounterId: string;
		declaredActionId: string;
	}): Promise<PendingDeclaredCombatAction | null>;
	markDeclaredActionResolving(declaredActionId: string): Promise<void>;
	markDeclaredActionPending(declaredActionId: string): Promise<void>;
	runIdempotentCombatCommand(
		encounterId: string,
		userId: string,
		requestId: string,
		expectedVersion: number,
		commandType: string,
		rateLimitOptions: undefined,
		execute: () => Promise<unknown>
	): Promise<unknown>;
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
