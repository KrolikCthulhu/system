export type CombatIntentTextToken =
	| 'intentName'
	| 'attackerName'
	| 'targetName'
	| 'weaponName'
	| 'attackProfileName'
	| 'attackSkill'
	| 'attackCharacteristic'
	| 'baseCost'
	| 'baseDamage'
	| 'rangeMeters'
	| 'damageTypes'
	| 'selectedDamageType'
	| 'defenseOptions'
	| 'cleanSuccesses'
	| 'damageFormula'
	| 'randomHitZones'
	| 'targetedMainZones'
	| 'targetedSubzones'
	| 'armorRule';

export type CombatIntentTextBlock =
	| {
			kind: 'text';
			text: string;
			isActive: boolean;
			sortOrder: number;
	  }
	| {
			kind: 'token';
			token: CombatIntentTextToken;
			isActive: boolean;
			sortOrder: number;
	  };

export interface CombatIntent {
	id: string;
	slug: string;
	name: string;
	category: string;
	description: string;
	mechanic: Record<string, unknown>;
	textBlocks: CombatIntentTextBlock[];
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface CombatIntentsCatalog {
	combatIntents: CombatIntent[];
}
