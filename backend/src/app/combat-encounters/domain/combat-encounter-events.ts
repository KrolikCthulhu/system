import {
	CombatDefenseOption,
	CombatResolvedRoll
} from './combat-action-check.types';
import { JsonObject } from './json.types';

export const combatEncounterEventTypes = {
	actionDeclared: 'action_declared',
	actionExecuted: 'action_executed',
	actionResolved: 'action_resolved',
	defenseRequested: 'defense_requested',
	turnSkipped: 'turn_skipped'
} as const;

export type CombatEncounterEventType =
	(typeof combatEncounterEventTypes)[keyof typeof combatEncounterEventTypes];

export interface CombatActionResultPayload {
	cleanSuccesses?: number;
}

export interface CombatEncounterEventDraft {
	type: CombatEncounterEventType;
	actionSlug: string | null;
	payload: JsonObject;
}

export function createTurnSkippedEvent(input: {
	participantName: string;
	fromPotential: number;
	toPotential: number;
}): CombatEncounterEventDraft {
	return {
		type: combatEncounterEventTypes.turnSkipped,
		actionSlug: null,
		payload: {
			participantName: input.participantName,
			fromPotential: input.fromPotential,
			toPotential: input.toPotential
		}
	};
}

export function createActionDeclaredEvent(input: {
	actionSlug: string;
	actionName: string;
	declaredAtPotential: number;
	resolveAtPotential: number;
}): CombatEncounterEventDraft {
	return {
		type: combatEncounterEventTypes.actionDeclared,
		actionSlug: input.actionSlug,
		payload: {
			actionName: input.actionName,
			declaredAtPotential: input.declaredAtPotential,
			resolveAtPotential: input.resolveAtPotential
		}
	};
}

export function createDefenseRequestedEvent(input: {
	actionSlug: string;
	actionName: string;
	attackRoll: CombatResolvedRoll | null;
	defenseOptions: CombatDefenseOption[];
}): CombatEncounterEventDraft {
	return {
		type: combatEncounterEventTypes.defenseRequested,
		actionSlug: input.actionSlug,
		payload: {
			actionName: input.actionName,
			attackRoll: serializeRoll(input.attackRoll),
			defenseOptions: input.defenseOptions.map(serializeDefenseOption)
		}
	};
}

export function createActionExecutedEvent(input: {
	actionSlug: string;
	actionName: string;
	result: CombatActionResultPayload;
	attackRoll: CombatResolvedRoll | null;
	defenseRoll: CombatResolvedRoll | null;
	defense: CombatDefenseOption | null;
	effects: JsonObject[];
}): CombatEncounterEventDraft {
	return {
		type: combatEncounterEventTypes.actionExecuted,
		actionSlug: input.actionSlug,
		payload: createActionResolutionPayload(input)
	};
}

export function createActionResolvedEvent(input: {
	actionSlug: string;
	actionName: string;
	result: CombatActionResultPayload;
	attackRoll: CombatResolvedRoll | null;
	defenseRoll: CombatResolvedRoll | null;
	defense: CombatDefenseOption;
	effects: JsonObject[];
}): CombatEncounterEventDraft {
	return {
		type: combatEncounterEventTypes.actionResolved,
		actionSlug: input.actionSlug,
		payload: createActionResolutionPayload(input)
	};
}

export function createDamageEffectEvent(input: {
	targetParticipantId: string;
	value: number;
	damageType: string | null;
}): JsonObject {
	return {
		type: 'damage',
		targetParticipantId: input.targetParticipantId,
		value: input.value,
		damageType: input.damageType
	};
}

export function createConditionAppliedEvent(input: {
	targetParticipantId: string;
	conditionId: string;
	conditionSlug: string;
	level: number;
}): JsonObject {
	return {
		type: 'condition_applied',
		targetParticipantId: input.targetParticipantId,
		conditionId: input.conditionId,
		conditionSlug: input.conditionSlug,
		level: input.level
	};
}

export function createConditionRemovedEvent(input: {
	targetParticipantId: string;
	conditionId: string;
	conditionSlug: string;
	count: number;
}): JsonObject {
	return {
		type: 'condition_removed',
		targetParticipantId: input.targetParticipantId,
		conditionId: input.conditionId,
		conditionSlug: input.conditionSlug,
		count: input.count
	};
}

export function createConditionsLinkedEvent(input: {
	sourceParticipantId: string;
	targetParticipantId: string;
	sourceConditionSlug: string;
	targetConditionSlug: string;
}): JsonObject {
	return {
		type: 'conditions_linked',
		sourceParticipantId: input.sourceParticipantId,
		targetParticipantId: input.targetParticipantId,
		sourceConditionSlug: input.sourceConditionSlug,
		targetConditionSlug: input.targetConditionSlug
	};
}

export function createConditionsUnlinkedEvent(input: {
	linkId: string;
	targetParticipantId: string;
	sourceConditionSlug: string;
	targetConditionSlug: string | null;
}): JsonObject {
	return {
		type: 'conditions_unlinked',
		linkId: input.linkId,
		targetParticipantId: input.targetParticipantId,
		sourceConditionSlug: input.sourceConditionSlug,
		targetConditionSlug: input.targetConditionSlug
	};
}

export function createMoveLinkedTargetEvent(input: {
	targetParticipantId: string | null;
	sourceConditionSlug: string | null;
	value: number | null;
}): JsonObject {
	return {
		type: 'move_linked_target',
		targetParticipantId: input.targetParticipantId,
		sourceConditionSlug: input.sourceConditionSlug,
		value: input.value
	};
}

export function createTextEffectEvent(input: {
	type: 'dice_pool_modifier' | 'special_rule';
	text: string;
}): JsonObject {
	return {
		type: input.type,
		text: input.text
	};
}

export function createUnsupportedEffectEvent(input: {
	effectType: string;
}): JsonObject {
	return {
		type: 'unsupported_effect',
		effectType: input.effectType
	};
}

function createActionResolutionPayload(input: {
	actionName: string;
	result: CombatActionResultPayload;
	attackRoll: CombatResolvedRoll | null;
	defenseRoll: CombatResolvedRoll | null;
	defense: CombatDefenseOption | null;
	effects: JsonObject[];
}): JsonObject {
	return {
		actionName: input.actionName,
		result: {
			cleanSuccesses: input.result.cleanSuccesses ?? 0
		},
		attackRoll: serializeRoll(input.attackRoll),
		defenseRoll: serializeRoll(input.defenseRoll),
		defense: input.defense ? serializeDefenseOption(input.defense) : null,
		effects: input.effects
	};
}

function serializeRoll(roll: CombatResolvedRoll | null): JsonObject | null {
	if (!roll) {
		return null;
	}

	return {
		skillSlug: roll.skillSlug,
		skillName: roll.skillName,
		characteristicSlug: roll.characteristicSlug,
		characteristicName: roll.characteristicName,
		diceCount: roll.diceCount,
		dice: roll.dice,
		successes: roll.successes,
		sixes: roll.sixes,
		ones: roll.ones,
		ignoredOnes: roll.ignoredOnes,
		consequenceCount: roll.consequenceCount,
		skillLevel: roll.skillLevel
	};
}

function serializeDefenseOption(option: CombatDefenseOption): JsonObject {
	return {
		mode: option.mode,
		label: option.label,
		skillSlug: option.skillSlug,
		skillName: option.skillName
	};
}
