export interface WeaponReference {
	id: string;
	slug: string;
	name: string;
}

export interface WeaponSkillOption extends WeaponReference {
	categoryId: string;
	category: WeaponReference;
	isActive: boolean;
	sortOrder: number;
	searchText?: string;
}

export interface WeaponSkillOptionGroup {
	label: string;
	items: WeaponSkillOption[];
}

export type WeaponAttackProfileKind = 'melee' | 'ranged';

export interface WeaponCombatIntentOption extends WeaponReference {
	category: string;
	isActive: boolean;
	sortOrder: number;
}

export interface WeaponCombatIntentOptionGroup {
	label: string;
	items: WeaponCombatIntentOption[];
}

export interface WeaponDamageTypeOption extends WeaponReference {
	isActive: boolean;
	sortOrder: number;
}

export interface WeaponCharacteristicOption {
	id: string;
	name: string;
	isActive: boolean;
	sortOrder: number;
}

export interface WeaponAttackProfileIntent {
	id: string;
	combatIntentId: string;
	combatIntent: WeaponCombatIntentOption;
	costModifier: number;
	damageModifier: number;
	ruleText: string;
	sortOrder: number;
}

export interface WeaponAttackProfile {
	id: string;
	kind: WeaponAttackProfileKind;
	name: string;
	skillId: string;
	skill: WeaponSkillOption;
	characteristicId: string | null;
	characteristic: WeaponCharacteristicOption | null;
	baseCost: number;
	baseDamage: number;
	rangeMeters: number;
	usesAmmo: boolean;
	damageTypeIds: string[];
	damageTypes: WeaponDamageTypeOption[];
	isActive: boolean;
	sortOrder: number;
	intents: WeaponAttackProfileIntent[];
}

export interface WeaponTemplate {
	id: string;
	slug: string;
	name: string;
	skillId: string;
	skill: WeaponSkillOption;
	handsMin: number;
	handsMax: number;
	defaultHands: number;
	attackProfiles: WeaponAttackProfile[];
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface Weapon {
	id: string;
	slug: string;
	name: string;
	templateId: string;
	template: Pick<
		WeaponTemplate,
		'id' | 'slug' | 'name' | 'handsMin' | 'handsMax' | 'defaultHands' | 'skillId'
	>;
	skillId: string;
	skill: WeaponSkillOption;
	extraDamage: number;
	attackProfiles: WeaponAttackProfile[];
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface WeaponsCatalog {
	weapons: Weapon[];
	templates: WeaponTemplate[];
	skills: WeaponSkillOption[];
	characteristics: WeaponCharacteristicOption[];
	combatIntents: WeaponCombatIntentOption[];
	damageTypes: WeaponDamageTypeOption[];
}
