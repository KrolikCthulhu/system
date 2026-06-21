import { ValueGraphState } from '../../../values/ui/value-graph.models';
import { RollConsequenceDto } from '../../../roll-consequences/data/dto/roll-consequences.dto';

export interface SkillSystemValueDto {
	id: string;
	calculationGraph: ValueGraphState | null;
}

export interface SkillCategoryDto {
	id: string;
	slug: string;
	name: string;
	description: string;
	isActive: boolean;
}

export interface SkillDto {
	id: string;
	slug: string;
	name: string;
	categoryId: string;
	description: string;
	rollConsequenceId: string | null;
	rollCharacteristicId?: string | null;
	defaultLevel: number;
	maxLevel: number;
	usesDefaultLevelRules: boolean;
	isActive: boolean;
	systemValue: SkillSystemValueDto;
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
	rollConsequences: RollConsequenceDto[];
}
