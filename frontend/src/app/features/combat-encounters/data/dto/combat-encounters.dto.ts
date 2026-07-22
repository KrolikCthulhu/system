import {
	CombatEncounterParticipantKind,
	CombatEncounterStatus,
	KnockdownSizeRuleResult
} from '../../domain/combat-encounters.models';

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
	createdAt: string;
	updatedAt: string;
}

export interface CombatEncounterDto {
	id: string;
	campaignId: string;
	name: string;
	status: CombatEncounterStatus;
	isActive: boolean;
	participants: CombatEncounterParticipantDto[];
	createdAt: string;
	updatedAt: string;
}

export interface CombatEncountersResponseDto {
	encounters: CombatEncounterDto[];
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

export interface KnockdownSizeRuleResultDto extends KnockdownSizeRuleResult {}
