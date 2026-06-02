export interface CreateSkillCommand {
	name: string;
	categoryId: string;
	description: string;
	rollConsequenceId: string | null;
	dicePoolValueId: string | null;
	defaultLevel: number;
	maxLevel: number;
	usesDefaultLevelRules: boolean;
}

export interface UpdateSkillCommand extends CreateSkillCommand {
	id: string;
}

export interface UpdateSkillActiveCommand {
	id: string;
	isActive: boolean;
}

export interface CreateSkillCategoryCommand {
	name: string;
	description: string;
}

export interface UpdateSkillCategoryCommand extends CreateSkillCategoryCommand {
	id: string;
}

export interface UpdateSkillCategoryActiveCommand {
	id: string;
	isActive: boolean;
}

export interface UpdateSkillLevelCommand {
	id: string;
	name: string;
	canRoll: boolean;
	successMin: number | null;
	doubleSuccessMin: number | null;
	ignoreOnesCount: number;
	ruleText: string;
}

export interface UpdateSkillLevelActiveCommand {
	id: string;
	isActive: boolean;
}
