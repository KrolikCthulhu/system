import {
	Skill,
	SkillCategory,
	SkillLevel,
	SkillsAdminCatalog
} from '../../domain/skills.models';
import {
	SkillCategoryDto,
	SkillDto,
	SkillLevelDto,
	SkillsAdminCatalogDto
} from '../dto/skills.dto';
import { createSystemValueDefinition } from '../../../../shared/types/system-value.models';
import { mapRollConsequenceDto } from '../../../roll-consequences/data/mappers/roll-consequences.mapper';

export function mapSkillCategoryDto(dto: SkillCategoryDto): SkillCategory {
	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		description: dto.description,
		isActive: dto.isActive
	};
}

export function mapSkillDto(dto: SkillDto): Skill {
	const systemValue = createSystemValueDefinition(dto.systemValue.id);

	return {
		id: dto.id,
		slug: dto.slug,
		name: dto.name,
		categoryId: dto.categoryId,
		description: dto.description,
		rollConsequenceId: dto.rollConsequenceId,
		rollCharacteristicId: dto.rollCharacteristicId ?? null,
		defaultLevel: dto.defaultLevel,
		maxLevel: dto.maxLevel,
		usesDefaultLevelRules: dto.usesDefaultLevelRules,
		isActive: dto.isActive,
		systemValue: {
			...systemValue,
			calculationGraph: dto.systemValue.calculationGraph
		}
	};
}

export function mapSkillLevelDto(dto: SkillLevelDto): SkillLevel {
	return {
		id: dto.id,
		level: dto.level,
		name: dto.name,
		canRoll: dto.canRoll,
		successMin: dto.successMin,
		doubleSuccessMin: dto.doubleSuccessMin,
		ignoreOnesCount: dto.ignoreOnesCount,
		expectedSuccessPerDie: dto.expectedSuccessPerDie,
		ruleText: dto.ruleText ?? '',
		isActive: dto.isActive
	};
}

export function mapSkillsAdminCatalogDto(
	dto: SkillsAdminCatalogDto
): SkillsAdminCatalog {
	return {
		categories: dto.categories.map(mapSkillCategoryDto),
		skills: dto.skills.map(mapSkillDto),
		levels: dto.levels.map(mapSkillLevelDto),
		rollConsequences: dto.rollConsequences.map(mapRollConsequenceDto)
	};
}
