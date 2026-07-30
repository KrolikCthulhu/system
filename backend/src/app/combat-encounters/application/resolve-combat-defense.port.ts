import {
	CombatDefenseOption,
	CombatResolvedRoll
} from '../domain/combat-action-check.types';
import { CombatEncounterPolicyDefenseRequest } from '../combat-encounter-policy.service';
import { RuntimeAction } from '../domain/combat-encounter-runtime.types';
import { JsonValue } from './combat-encounter.read-model';
import { SkipCombatTurnEncounter } from './skip-combat-turn.port';

export const RESOLVE_COMBAT_DEFENSE_INFRASTRUCTURE = Symbol(
	'RESOLVE_COMBAT_DEFENSE_INFRASTRUCTURE'
);

export interface PendingCombatDefenseRequest
	extends CombatEncounterPolicyDefenseRequest {
	id: string;
	actorParticipantId: string;
	targetParticipantId: string;
	actionSlug: string;
	actionSnapshot: JsonValue;
	attackRoll: JsonValue;
	defenseOptions: JsonValue;
	resolution: JsonValue;
}

export interface ResolveCombatDefenseInfrastructurePort {
	findEncounter(id: string): Promise<SkipCombatTurnEncounter>;
	findPendingDefenseRequest(input: {
		encounterId: string;
		defenseRequestId: string;
	}): Promise<PendingCombatDefenseRequest | null>;
	resolveSelectedDefenseOption(input: {
		options: CombatDefenseOption[];
		mode: 'dodge' | 'parry' | 'none';
		skillSlug?: string | null;
	}): Promise<CombatDefenseOption>;
	runIdempotentCombatCommand(
		encounterId: string,
		userId: string,
		requestId: string,
		expectedVersion: number,
		commandType: string,
		rateLimitOptions:
			| {
					userLimit?: number;
					encounterLimit?: number;
					windowMs?: number;
			  }
			| undefined,
		execute: () => Promise<unknown>
	): Promise<unknown>;
	resolvePendingDefense(input: {
		encounterId: string;
		userId: string;
		request: PendingCombatDefenseRequest;
		action: RuntimeAction;
		defense: CombatDefenseOption;
		attackRoll: CombatResolvedRoll | null;
		declaredActionId: string | null;
	}): Promise<void>;
	publishAndReturnEncounter(
		encounterId: string,
		userId: string
	): Promise<unknown>;
}
