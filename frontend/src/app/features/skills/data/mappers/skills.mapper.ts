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

export function mapSkillCategoryDto(dto: SkillCategoryDto): SkillCategory {
	return {
		id: dto.id,
		name: dto.name,
		code: dto.code,
		description: dto.description,
		isActive: dto.isActive
	};
}

export function mapSkillDto(dto: SkillDto): Skill {
	return {
		id: dto.id,
		name: dto.name,
		code: dto.code,
		categoryId: dto.categoryId,
		description: dto.description,
		defaultLevel: dto.defaultLevel,
		maxLevel: dto.maxLevel,
		usesDefaultLevelRules: dto.usesDefaultLevelRules,
		isActive: dto.isActive
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
		ruleText: dto.ruleText,
		isActive: dto.isActive
	};
}

export function mapSkillsAdminCatalogDto(
	dto: SkillsAdminCatalogDto
): SkillsAdminCatalog {
	return {
		categories: dto.categories.map(mapSkillCategoryDto),
		skills: dto.skills.map(mapSkillDto),
		levels: dto.levels.map(mapSkillLevelDto)
	};
}
