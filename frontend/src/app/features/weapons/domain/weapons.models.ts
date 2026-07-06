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

export interface Weapon {
	id: string;
	slug: string;
	name: string;
	skillId: string;
	skill: WeaponSkillOption;
	extraDamage: number;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface WeaponsCatalog {
	weapons: Weapon[];
	skills: WeaponSkillOption[];
}
