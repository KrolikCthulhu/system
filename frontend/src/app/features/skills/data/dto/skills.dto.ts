export interface SkillCategoryDto {
	id: string;
	name: string;
	description: string;
	isActive: boolean;
}

export interface SkillDto {
	id: string;
	name: string;
	categoryId: string;
	description: string;
	defaultLevel: number;
	maxLevel: number;
	usesDefaultLevelRules: boolean;
	isActive: boolean;
}

export interface SkillLevelDto {
	id: string;
	level: number;
	name: string;
	canRoll: boolean;
	successMin: number | null;
	doubleSuccessMin: number | null;
	ignoreOnesCount: number;
	expectedSuccessPerDie: number;
	ruleText: string | null;
	isActive: boolean;
}

export interface SkillsAdminCatalogDto {
	categories: SkillCategoryDto[];
	skills: SkillDto[];
	levels: SkillLevelDto[];
}
