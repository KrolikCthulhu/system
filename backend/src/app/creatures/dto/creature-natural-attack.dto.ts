import { Type } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsIn,
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Min,
	ValidateNested
} from 'class-validator';

export class CreatureAttackConditionRefDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	slug?: string;
}

export class CreatureAttackAvailabilityRuleDto {
	@IsIn(['resource_free', 'active_condition'])
	type!: 'resource_free' | 'active_condition';

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
	@IsIn(['release_grab', 'drag_grab', 'shake_grab', 'custom'])
	kind?: 'release_grab' | 'drag_grab' | 'shake_grab' | 'custom';

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
	keepsGrab?: boolean;

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
