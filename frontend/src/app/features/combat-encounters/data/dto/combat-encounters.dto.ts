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
	initiative: number | null;
	isActive: boolean;
	sortOrder: number;
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
	initiative?: number | null;
	isActive?: boolean;
}

export interface UpdateCombatEncounterDto {
	status?: CombatEncounterStatus;
}

export interface ExecuteCombatActionDto {
	actorParticipantId: string;
	actionSlug: string;
	targetParticipantId?: string | null;
}

export interface ResolveCombatDefenseDto {
	defenseRequestId: string;
	mode: 'dodge' | 'parry' | 'none';
	skillSlug?: string | null;
}

export interface ResolveDeclaredCombatActionDto {
	declaredActionId: string;
}

export interface KnockdownSizeRuleResultDto extends KnockdownSizeRuleResult {}
