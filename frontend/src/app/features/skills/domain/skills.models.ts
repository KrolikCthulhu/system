import { SystemValueCalculationDefinition } from '../../values/domain/system-value-calculation.models';
import { RollConsequence } from '../../roll-consequences/domain/roll-consequences.models';

export interface SkillCategory {
	id: string;
	name: string;
	description: string;
	isActive: boolean;
}

export interface Skill {
	id: string;
	name: string;
	categoryId: string;
	description: string;
	rollConsequenceId: string | null;
	rollCharacteristicId: string | null;
	defaultLevel: number;
	maxLevel: number;
	usesDefaultLevelRules: boolean;
	isActive: boolean;
	systemValue: SystemValueCalculationDefinition;
}

export interface SkillLevel {
	id: string;
	level: number;
	name: string;
	canRoll: boolean;
	successMin: number | null;
	doubleSuccessMin: number | null;
	ignoreOnesCount: number;
	expectedSuccessPerDie: number;
	ruleText: string;
	isActive: boolean;
}

export interface SkillsAdminCatalog {
	categories: SkillCategory[];
	skills: Skill[];
	levels: SkillLevel[];
	rollConsequences: RollConsequence[];
}
