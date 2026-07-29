import {
	CreatureNaturalAttack,
	CreatureTierAction
} from '../../creatures/domain/creatures.models';

export type CombatEncounterStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED';
export type CombatEncounterParticipantKind = 'PLAYER_CHARACTER' | 'CREATURE';
export type CombatEncounterCurrentUserRole = 'GM' | 'PLAYER';

export interface CombatEncounterParticipantOwner {
	id: string;
	displayUsername: string;
	username: string;
}

export interface CombatEncounterPlayerCharacter {
	id: string;
	name: string;
	owner: CombatEncounterParticipantOwner;
}

export interface CombatEncounterCreature {
	id: string;
	name: string;
	actions: CreatureTierAction[];
	naturalAttacks: CreatureNaturalAttack[];
}

export interface CombatEncounterCreatureSize {
	id: string;
	slug: string;
	name: string;
	rank: number;
}

export interface CombatEncounterCreatureTier {
	id: string;
	tier: number;
	name: string;
	hp: number;
	sizeId: string | null;
	size: CombatEncounterCreatureSize | null;
	actions: CreatureTierAction[];
	actionOverrides: CreatureTierAction[];
}

export interface CombatEncounterConditionReference {
	id: string;
	slug: string;
	name: string;
}

export interface CombatEncounterParticipantCondition {
	id: string;
	conditionId: string;
	condition: CombatEncounterConditionReference;
	displayName: string | null;
	level: number;
	sourceParticipantId: string | null;
	sourceActionSlug: string | null;
	metadata: unknown;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CombatEncounterParticipant {
	id: string;
	kind: CombatEncounterParticipantKind;
	playerCharacterId: string | null;
	playerCharacter: CombatEncounterPlayerCharacter | null;
	creatureId: string | null;
	creature: CombatEncounterCreature | null;
	creatureTierId: string | null;
	creatureTier: CombatEncounterCreatureTier | null;
	sceneName: string;
	currentHealth: number;
	currentPotential: number;
	initiative: number | null;
	isActive: boolean;
	sortOrder: number;
	conditions: CombatEncounterParticipantCondition[];
	createdAt: string;
	updatedAt: string;
}

export interface CombatEncounterConditionLink {
	id: string;
	sourceParticipantId: string;
	targetParticipantId: string;
	sourceConditionId: string;
	sourceCondition: CombatEncounterConditionReference;
	targetConditionId: string;
	targetCondition: CombatEncounterConditionReference;
	sourceConditionInstanceId: string | null;
	targetConditionInstanceId: string | null;
	sourceActionSlug: string | null;
	metadata: unknown;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export type CombatDefenseMode = 'dodge' | 'parry' | 'none';

export interface CombatDefenseOption {
	mode: CombatDefenseMode;
	label: string;
	skillSlug: string | null;
	skillName: string | null;
}

export interface CombatEncounterDefenseRequest {
	id: string;
	actorParticipantId: string;
	targetParticipantId: string;
	createdByUserId: string;
	actionSlug: string;
	actionSnapshot: unknown;
	attackRoll: unknown;
	defenseOptions: CombatDefenseOption[];
	status: string;
	resolvedByUserId: string | null;
	resolvedAt: string | null;
	resolution: unknown;
	createdAt: string;
	updatedAt: string;
}

export interface CombatEncounterDeclaredAction {
	id: string;
	actorParticipantId: string;
	targetParticipantId: string | null;
	createdByUserId: string;
	actionSlug: string;
	actionSnapshot: unknown;
	declaredAtPotential: number;
	resolveAtPotential: number;
	status: string;
	resolvedByUserId: string | null;
	resolvedAt: string | null;
	resolution: unknown;
	createdAt: string;
	updatedAt: string;
}

export interface CombatEncounterEvent {
	id: string;
	createdByUserId: string;
	actorParticipantId: string | null;
	targetParticipantId: string | null;
	type: string;
	actionSlug: string | null;
	payload: unknown;
	createdAt: string;
}

export interface CombatEncounter {
	id: string;
	campaignId: string;
	name: string;
	status: CombatEncounterStatus;
	currentUserRole: CombatEncounterCurrentUserRole;
	isActive: boolean;
	participants: CombatEncounterParticipant[];
	conditionLinks: CombatEncounterConditionLink[];
	defenseRequests: CombatEncounterDefenseRequest[];
	declaredActions: CombatEncounterDeclaredAction[];
	events: CombatEncounterEvent[];
	createdAt: string;
	updatedAt: string;
}

export interface CombatEncounterSummary {
	id: string;
	campaignId: string;
	name: string;
	status: CombatEncounterStatus;
	isActive: boolean;
	participantsCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface CombatSizeRuleSize {
	id: string | null;
	name: string;
	rank: number;
	source: 'creature_tier' | 'default';
}

export interface KnockdownSizeRuleResult {
	attackerSize: CombatSizeRuleSize;
	targetSize: CombatSizeRuleSize;
	sizeDifference: number;
	isAvailable: boolean;
	requiredCleanSuccesses: number | null;
	text: string;
}
