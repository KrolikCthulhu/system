import { CombatEncounterStatus } from '../domain/combat-encounter.types';
import { JsonValue } from '../domain/json.types';

export { JsonValue };

export interface CombatEncounterReadModel {
	id: string;
	campaignId: string;
	campaign: {
		combatActionResolutionMode: string;
	};
	name: string;
	status: CombatEncounterStatus;
	currentRound: number;
	stateVersion: number;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	participants: CombatEncounterParticipantReadModel[];
	conditionLinks: CombatEncounterConditionLinkReadModel[];
	events: CombatEncounterEventReadModel[];
	defenseRequests: CombatEncounterDefenseRequestReadModel[];
	declaredActions: CombatEncounterDeclaredActionReadModel[];
}

export interface CombatEncounterSummaryReadModel {
	id: string;
	campaignId: string;
	name: string;
	status: CombatEncounterStatus;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
	_count: {
		participants: number;
	};
}

export interface CombatEncounterParticipantReadModel {
	id: string;
	kind: string;
	playerCharacterId: string | null;
	playerCharacter: {
		id: string;
		name: string;
		ownerUser: {
			id: string;
			displayUsername: string | null;
			username: string | null;
		};
	} | null;
	creatureId: string | null;
	creature: {
		id: string;
		name: string;
		actions: JsonValue;
		naturalAttackLinks: Array<{
			id: string;
			naturalAttackId: string;
			naturalAttack: {
				id: string;
				slug: string;
				name: string;
			};
			attackProfiles: JsonValue;
			isActive: boolean;
			sortOrder: number;
		}>;
	} | null;
	creatureTierId: string | null;
	creatureTier: {
		id: string;
		tier: number;
		name: string | null;
		hp: number;
		sizeId: string | null;
		actions: JsonValue;
		actionOverrides: JsonValue;
		size: {
			id: string;
			slug: string;
			name: string;
			rank: number;
		} | null;
	} | null;
	sceneName: string;
	currentHealth: number;
	currentPotential: number;
	maximumPotential: number;
	currentSpeed: number;
	defenseStanceRound: number | null;
	roundParticipationEndedRound: number | null;
	isActive: boolean;
	sortOrder: number;
	conditions: Array<{
		id: string;
		conditionId: string;
		condition: {
			id: string;
			slug: string;
			name: string;
		};
		displayName: string;
		level: number;
		sourceParticipantId: string | null;
		sourceActionSlug: string | null;
		metadata: JsonValue;
		isActive: boolean;
		createdAt: Date;
		updatedAt: Date;
	}>;
	createdAt: Date;
	updatedAt: Date;
}

export interface CombatEncounterConditionLinkReadModel {
	id: string;
	sourceParticipantId: string;
	targetParticipantId: string;
	sourceConditionId: string;
	sourceCondition: {
		id: string;
		slug: string;
		name: string;
	};
	targetConditionId: string;
	targetCondition: {
		id: string;
		slug: string;
		name: string;
	};
	sourceConditionInstanceId: string;
	targetConditionInstanceId: string;
	sourceActionSlug: string | null;
	metadata: JsonValue;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface CombatEncounterEventReadModel {
	id: string;
	createdByUserId: string;
	actorParticipantId: string | null;
	targetParticipantId: string | null;
	type: string;
	actionSlug: string | null;
	payload: JsonValue;
	createdAt: Date;
}

export interface CombatEncounterDefenseRequestReadModel {
	id: string;
	actorParticipantId: string;
	targetParticipantId: string;
	createdByUserId: string;
	actionSlug: string;
	actionSnapshot: JsonValue;
	attackRoll: JsonValue;
	defenseOptions: JsonValue;
	status: string;
	resolvedByUserId: string | null;
	resolvedAt: Date | null;
	resolution: JsonValue;
	createdAt: Date;
	updatedAt: Date;
}

export interface CombatEncounterDeclaredActionReadModel {
	id: string;
	actorParticipantId: string;
	targetParticipantId: string | null;
	createdByUserId: string;
	actionSlug: string;
	actionSnapshot: JsonValue;
	declaredAtPotential: number;
	resolveAtPotential: number;
	status: string;
	resolvedByUserId: string | null;
	resolvedAt: Date | null;
	resolution: JsonValue;
	createdAt: Date;
	updatedAt: Date;
}

export type CombatEncounterSnapshot = unknown;
