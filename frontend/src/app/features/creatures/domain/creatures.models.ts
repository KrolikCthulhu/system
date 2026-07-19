export interface CreatureReference {
	id: string;
	slug: string;
	name: string;
}

export interface CreatureTypeOption extends CreatureReference {
	isActive: boolean;
	sortOrder: number;
}

export type CreatureAnatomySchemeOption = CreatureTypeOption;

export interface CreatureArmorPresetOption extends CreatureTypeOption {
	points: number;
	protection: number;
}

export interface CreatureSkillOption extends CreatureTypeOption {
	categoryId: string;
	rollCharacteristicId: string | null;
	category: CreatureReference;
	maxLevel: number;
	searchText?: string;
}

export interface CreatureCharacteristicOption {
	id: string;
	name: string;
	minValue: number;
	maxValue: number;
	defaultValue: number;
	isActive: boolean;
	sortOrder: number;
}

export interface CreatureSkillOptionGroup {
	label: string;
	items: CreatureSkillOption[];
}

export interface CreatureTierSkill {
	id: string;
	skillId: string;
	level: number;
	skill: CreatureReference;
}

export interface CreatureTierCharacteristic {
	id: string;
	characteristicId: string;
	value: number;
	characteristic: CreatureCharacteristicOption;
}

export interface CreatureTier {
	id: string;
	tier: number;
	name: string;
	hp: number;
	armorPresetId: string | null;
	armorPreset: CreatureArmorPresetOption | null;
	skills: CreatureTierSkill[];
	characteristics: CreatureTierCharacteristic[];
	isActive: boolean;
	sortOrder: number;
}

export type CreatureAnatomyZoneKind = 'MAIN' | 'TARGETED';

export interface CreatureAnatomyZone {
	id: string;
	slug: string;
	name: string;
	sourceZoneId: string | null;
	parentId: string | null;
	kind: CreatureAnatomyZoneKind;
	isRandomHitEligible: boolean;
	randomHitWeight: number;
	targetedAttackDicePenalty: number;
	extraPotentialCost: number;
	overriddenFields: string[];
	isInherited: boolean;
	isRemoved: boolean;
	isActive: boolean;
	sortOrder: number;
}

export interface Creature {
	id: string;
	slug: string;
	name: string;
	typeId: string;
	type: CreatureReference;
	anatomySchemeId: string | null;
	anatomyScheme: CreatureReference | null;
	anatomyZones: CreatureAnatomyZone[];
	tiers: CreatureTier[];
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreaturesCatalog {
	creatures: Creature[];
	creatureTypes: CreatureTypeOption[];
	anatomySchemes: CreatureAnatomySchemeOption[];
	armorPresets: CreatureArmorPresetOption[];
	skills: CreatureSkillOption[];
	characteristics: CreatureCharacteristicOption[];
}
