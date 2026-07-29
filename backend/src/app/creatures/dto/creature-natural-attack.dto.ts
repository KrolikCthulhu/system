import { Type } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsIn,
	IsInt,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Min,
	ValidateNested
} from 'class-validator';

export class CreatureNaturalAttackProfileDefenseDto {
	@IsIn(['none', 'target_physical_defense'])
	type!: 'none' | 'target_physical_defense';

	@IsOptional()
	@IsBoolean()
	canDodge?: boolean;

	@IsOptional()
	@IsBoolean()
	canParry?: boolean;

	@IsOptional()
	@IsArray()
	@IsIn(['unarmed', 'melee_weapon', 'shield'], { each: true })
	parrySkillGroups?: ('unarmed' | 'melee_weapon' | 'shield')[];
}

export class CreatureAttackConditionRefDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	slug?: string;
}

export class CreatureAttackAvailabilityComparisonOperandDto {
	@IsIn(['actor_property', 'target_property', 'constant'])
	kind!: 'actor_property' | 'target_property' | 'constant';

	@IsOptional()
	@IsIn(['sizeRank'])
	property?: 'sizeRank' | null;

	@IsOptional()
	@IsNumber()
	value?: number | null;
}

export class CreatureAttackAvailabilityRuleDto {
	@IsIn(['resource_free', 'active_condition', 'comparison', 'special_rule'])
	type!: 'resource_free' | 'active_condition' | 'comparison' | 'special_rule';

	@IsString()
	label!: string;

	@IsOptional()
	@IsString()
	resourceKey?: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => CreatureAttackConditionRefDto)
	condition?: CreatureAttackConditionRefDto;

	@IsOptional()
	@ValidateNested()
	@Type(() => CreatureAttackAvailabilityComparisonOperandDto)
	left?: CreatureAttackAvailabilityComparisonOperandDto | null;

	@IsOptional()
	@IsIn(['gt', 'gte', 'eq', 'ne', 'lte', 'lt'])
	operator?: 'gt' | 'gte' | 'eq' | 'ne' | 'lte' | 'lt' | null;

	@IsOptional()
	@ValidateNested()
	@Type(() => CreatureAttackAvailabilityComparisonOperandDto)
	right?: CreatureAttackAvailabilityComparisonOperandDto | null;

	@IsOptional()
	@IsString()
	unavailableText?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class CreatureNaturalAttackProfileIntentDto {
	@IsUUID()
	combatIntentId!: string;

	@IsOptional()
	@IsString()
	nameOverride?: string;

	@IsOptional()
	@IsInt()
	costModifier?: number;

	@IsOptional()
	@IsInt()
	damageModifier?: number;

	@IsOptional()
	@IsString()
	ruleText?: string;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureAttackAvailabilityRuleDto)
	availabilityRules?: CreatureAttackAvailabilityRuleDto[];

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class CreatureAttackFollowupActionDto {
	@IsOptional()
	@IsIn([
		'unlink_condition',
		'move_linked_target',
		'damage_linked_target',
		'custom'
	])
	kind?:
		| 'unlink_condition'
		| 'move_linked_target'
		| 'damage_linked_target'
		| 'custom';

	@IsString()
	name!: string;

	@IsOptional()
	@IsIn(['fixed', 'per_meter', 'rule'])
	costMode?: 'fixed' | 'per_meter' | 'rule';

	@IsOptional()
	@IsInt()
	@Min(0)
	costPotential?: number | null;

	@IsOptional()
	@IsInt()
	@Min(0)
	costPerMeter?: number | null;

	@IsOptional()
	@IsIn(['none', 'base_attack_damage', 'custom'])
	damageMode?: 'none' | 'base_attack_damage' | 'custom';

	@IsOptional()
	@IsBoolean()
	appliesArmor?: boolean;

	@IsOptional()
	@ValidateNested()
	@Type(() => CreatureAttackConditionRefDto)
	conditionOnDamage?: CreatureAttackConditionRefDto;

	@IsOptional()
	@IsInt()
	@Min(0)
	conditionLevel?: number;

	@IsOptional()
	@IsBoolean()
	keepsLinkedCondition?: boolean;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureAttackAvailabilityRuleDto)
	availabilityRules?: CreatureAttackAvailabilityRuleDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class CreatureNaturalAttackProfileDto {
	@IsIn(['melee', 'ranged'])
	kind!: 'melee' | 'ranged';

	@IsString()
	name!: string;

	@IsUUID()
	skillId!: string;

	@IsOptional()
	@IsUUID()
	characteristicId?: string | null;

	@IsInt()
	@Min(0)
	baseCost!: number;

	@IsInt()
	baseDamage!: number;

	@IsInt()
	@Min(0)
	rangeMeters!: number;

	@IsOptional()
	@IsBoolean()
	usesAmmo?: boolean;

	@IsOptional()
	@IsBoolean()
	canBeParried?: boolean;

	@IsOptional()
	@ValidateNested()
	@Type(() => CreatureNaturalAttackProfileDefenseDto)
	defaultDefense?: CreatureNaturalAttackProfileDefenseDto;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureAttackAvailabilityRuleDto)
	availabilityRules?: CreatureAttackAvailabilityRuleDto[];

	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	damageTypeIds?: string[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureNaturalAttackProfileIntentDto)
	intents?: CreatureNaturalAttackProfileIntentDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureAttackFollowupActionDto)
	followupActions?: CreatureAttackFollowupActionDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class CreatureNaturalAttackDto {
	@IsUUID()
	naturalAttackId!: string;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureNaturalAttackProfileDto)
	attackProfiles?: CreatureNaturalAttackProfileDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
