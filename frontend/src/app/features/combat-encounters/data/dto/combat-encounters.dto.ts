import {
	CombatEncounterParticipantKind,
	CombatEncounterStatus,
	CombatEncounterCurrentUserRole,
	CombatDefenseOption,
	KnockdownSizeRuleResult
} from '../../domain/combat-encounters.models';
import {
	CreatureNaturalAttack,
	CreatureTierAction
} from '../../../creatures/domain/creatures.models';

export interface CombatEncounterParticipantOwnerDto {
	id: string;
	displayUsername: string;
	username: string;
}

export interface CombatEncounterPlayerCharacterDto {
	id: string;
	name: string;
	owner: CombatEncounterParticipantOwnerDto;
}

export interface CombatEncounterCreatureDto {
	id: string;
	name: string;
	actions: CreatureTierAction[];
	naturalAttacks: CreatureNaturalAttack[];
}

export interface CombatEncounterCreatureSizeDto {
	id: string;
	slug: string;
	name: string;
	rank: number;
}

export interface CombatEncounterCreatureTierDto {
	id: string;
	tier: number;
	name: string;
	hp: number;
	sizeId: string | null;
	size: CombatEncounterCreatureSizeDto | null;
	actions: CreatureTierAction[];
	actionOverrides: CreatureTierAction[];
}

export interface CombatEncounterConditionReferenceDto {
	id: string;
	slug: string;
	name: string;
}

export interface CombatEncounterParticipantConditionDto {
	id: string;
	conditionId: string;
	condition: CombatEncounterConditionReferenceDto;
	displayName: string | null;
	level: number;
	sourceParticipantId: string | null;
	sourceActionSlug: string | null;
	metadata: unknown;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export type CombatAvailableActionKind = CreatureTierAction['kind'] | 'system';
export type CombatAvailableActionSourceType =
	| 'creature'
	| 'condition'
	| 'system';

export type CombatActionTargetMode =
	| 'self'
	| 'selected_target'
	| 'linked_condition_target'
	| 'none';

export interface CombatAvailableActionOptionDto {
	id: string;
	actionSlug: string;
	label: string;
	kind: CombatAvailableActionKind;
	sourceType: CombatAvailableActionSourceType;
	sourceName: string;
	sourceSlug: string | null;
	profileName: string;
	targetMode: CombatActionTargetMode;
	requiresTarget: boolean;
	costText: string;
	rangeText: string;
	description: string;
	targetChoiceLabel: string | null;
	confirmationTitle: string | null;
	optionLabelTemplate: string | null;
	costLabelTemplate: string | null;
	sortOrder: number;
	isAvailable: boolean;
	disabledReason: string | null;
	disabledReasons: string[];
	availableTargets: CombatAvailableActionTargetDto[];
}

export interface CombatAvailableActionTargetDto {
	participantId: string;
	label: string;
	potentialCost: number | null;
	costText: string;
	isAvailable: boolean;
	disabledReason: string | null;
	disabledReasons: string[];
}

export interface CombatAvailableActionGroupDto {
	id: string;
	kind: CombatAvailableActionKind;
	sourceName: string;
	profileName: string;
	rangeText: string;
	costText: string;
	actions: CombatAvailableActionOptionDto[];
}

export interface CombatAvailableActionsDto {
	attacks: CombatAvailableActionGroupDto[];
	abilities: CombatAvailableActionOptionDto[];
	contextualActions: CombatAvailableActionOptionDto[];
	systemActions: CombatAvailableActionOptionDto[];
}

export interface CombatEncounterParticipantDto {
	id: string;
	kind: CombatEncounterParticipantKind;
	playerCharacterId: string | null;
	playerCharacter: CombatEncounterPlayerCharacterDto | null;
	creatureId: string | null;
	creature: CombatEncounterCreatureDto | null;
	creatureTierId: string | null;
	creatureTier: CombatEncounterCreatureTierDto | null;
	sceneName: string;
	currentHealth: number;
	currentPotential: number;
	maximumPotential: number;
	currentSpeed: number;
	defenseStanceRound: number | null;
	roundParticipationEndedRound: number | null;
	isInDefenseStance: boolean;
	hasEndedRoundParticipation: boolean;
	isActive: boolean;
	sortOrder: number;
	availableActions: CombatAvailableActionsDto;
	conditions: CombatEncounterParticipantConditionDto[];
	createdAt: string;
	updatedAt: string;
}

export interface CombatEncounterConditionLinkDto {
	id: string;
	sourceParticipantId: string;
	targetParticipantId: string;
	sourceConditionId: string;
	sourceCondition: CombatEncounterConditionReferenceDto;
	targetConditionId: string;
	targetCondition: CombatEncounterConditionReferenceDto;
	sourceConditionInstanceId: string | null;
	targetConditionInstanceId: string | null;
	sourceActionSlug: string | null;
	metadata: unknown;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CombatEncounterDefenseRequestDto {
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

export interface CombatEncounterDeclaredActionDto {
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

export interface CombatEncounterEventDto {
	id: string;
	createdByUserId: string;
	actorParticipantId: string | null;
	targetParticipantId: string | null;
	type: string;
	actionSlug: string | null;
	payload: unknown;
	createdAt: string;
}

export interface CombatEncounterDto {
	id: string;
	campaignId: string;
	name: string;
	status: CombatEncounterStatus;
	currentRound: number;
	stateVersion: number;
	currentUserRole: CombatEncounterCurrentUserRole;
	isActive: boolean;
	participants: CombatEncounterParticipantDto[];
	conditionLinks: CombatEncounterConditionLinkDto[];
	defenseRequests: CombatEncounterDefenseRequestDto[];
	declaredActions: CombatEncounterDeclaredActionDto[];
	events: CombatEncounterEventDto[];
	createdAt: string;
	updatedAt: string;
}

export interface CombatEncounterSummaryDto {
	id: string;
	campaignId: string;
	name: string;
	status: CombatEncounterStatus;
	isActive: boolean;
	participantsCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface CombatEncountersResponseDto {
	encounters: CombatEncounterSummaryDto[];
}

export interface CreateCombatEncounterDto {
	name?: string;
}

export interface AddPlayerCharacterParticipantDto {
	playerCharacterId: string;
}

export interface AddCreatureParticipantDto {
	creatureId: string;
	creatureTierId?: string;
	sceneName?: string;
	count?: number;
}

export interface UpdateCombatParticipantDto {
	sceneName?: string;
	currentHealth?: number;
	currentPotential?: number;
	currentSpeed?: number;
	isActive?: boolean;
}

export interface UpdateCombatEncounterDto {
	status?: CombatEncounterStatus;
}

export interface ExecuteCombatActionDto {
	requestId?: string;
	expectedVersion: number;
	actorParticipantId: string;
	actionSlug: string;
	targetParticipantId?: string | null;
}

export interface CombatActionCommandDto extends ExecuteCombatActionDto {}

export interface WaitCombatTurnDto {
	requestId?: string;
	expectedVersion: number;
	actorParticipantId: string;
	targetParticipantId: string;
	actionSlug: string;
}

export interface EnterDefenseStanceDto {
	requestId?: string;
	expectedVersion: number;
	actorParticipantId: string;
	actionSlug: string;
}

export interface EndRoundParticipationDto {
	requestId?: string;
	expectedVersion: number;
	actorParticipantId: string;
	actionSlug: string;
}

export interface ResolveCombatDefenseDto {
	requestId?: string;
	expectedVersion: number;
	defenseRequestId: string;
	mode: 'dodge' | 'parry' | 'none';
	skillSlug?: string | null;
}

export interface ResolveDeclaredCombatActionDto {
	requestId?: string;
	expectedVersion: number;
	declaredActionId: string;
}

export interface KnockdownSizeRuleResultDto extends KnockdownSizeRuleResult {}
