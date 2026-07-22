export type CombatEncounterStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED';
export type CombatEncounterParticipantKind = 'PLAYER_CHARACTER' | 'CREATURE';

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
	createdAt: string;
	updatedAt: string;
}

export interface CombatEncounter {
	id: string;
	campaignId: string;
	name: string;
	status: CombatEncounterStatus;
	isActive: boolean;
	participants: CombatEncounterParticipant[];
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
