import {
	IsArray,
	IsBoolean,
	IsIn,
	IsInt,
	IsObject,
	IsOptional,
	IsString,
	IsUUID,
	Max,
	Min,
	ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreatureTierCharacteristicDto } from './creature-tier-characteristic.dto';
import { CreatureTierSkillDto } from './creature-tier-skill.dto';

export class CreatureTierAttackOverrideNaturalAttackDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	slug?: string;
}

export class CreatureTierAttackOverrideDto {
	@IsObject()
	@ValidateNested()
	@Type(() => CreatureTierAttackOverrideNaturalAttackDto)
	naturalAttack!: CreatureTierAttackOverrideNaturalAttackDto;

	@IsOptional()
	@IsIn(['melee', 'ranged'])
	profileKind?: 'melee' | 'ranged' | null;

	@IsOptional()
	@IsString()
	profileName?: string;

	@IsOptional()
	@IsBoolean()
	isAvailable?: boolean;

	@IsOptional()
	@IsInt()
	costModifier?: number;

	@IsOptional()
	@IsInt()
	damageModifier?: number;

	@IsOptional()
	@IsInt()
	rangeModifier?: number;

	@IsOptional()
	@IsInt()
	dicePoolModifier?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class CreatureTierAbilityConditionDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	slug?: string;
}

export class CreatureTierAbilityDto {
	@IsString()
	name!: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	costPotential?: number | null;

	@IsOptional()
	@IsString()
	target?: string;

	@IsOptional()
	@IsString()
	duration?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsString()
	effectText?: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => CreatureTierAbilityConditionDto)
	appliesCondition?: CreatureTierAbilityConditionDto | null;

	@IsOptional()
	@IsString()
	conditionDisplayName?: string;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class CreatureTierAttackAvailabilityRuleConditionDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	slug?: string;
}

export class CreatureTierAttackAvailabilityRuleDto {
	@IsIn(['resource_free', 'active_condition'])
	type!: 'resource_free' | 'active_condition';

	@IsString()
	label!: string;

	@IsOptional()
	@IsString()
	resourceKey?: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => CreatureTierAttackAvailabilityRuleConditionDto)
	condition?: CreatureTierAttackAvailabilityRuleConditionDto | null;

	@IsOptional()
	@IsString()
	unavailableText?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class CreatureTierActionReferenceDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	slug?: string;
}

export class CreatureTierActionSourceDto {
	@IsIn(['natural_attack', 'weapon', 'condition', 'ability', 'custom'])
	type!: 'natural_attack' | 'weapon' | 'condition' | 'ability' | 'custom';

	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	slug?: string;

	@IsOptional()
	@IsString()
	profileName?: string;

	@IsOptional()
	@ValidateNested()
	@Type(() => CreatureTierActionReferenceDto)
	intent?: CreatureTierActionReferenceDto | null;
}

export class CreatureTierActionCostDto {
	@IsIn(['free', 'fixed', 'per_meter', 'rule'])
	mode!: 'free' | 'fixed' | 'per_meter' | 'rule';

	@IsOptional()
	@IsInt()
	@Min(0)
	potential?: number | null;

	@IsOptional()
	@IsInt()
	@Min(0)
	perMeter?: number | null;
}

export class CreatureTierActionTargetDto {
	@IsIn([
		'self',
		'creature',
		'hostile_creature',
		'held_target',
		'marked_target',
		'none'
	])
	type!:
		| 'self'
		| 'creature'
		| 'hostile_creature'
		| 'held_target'
		| 'marked_target'
		| 'none';

	@IsOptional()
	@IsIn(['visible', 'any'])
	visibility?: 'visible' | 'any';

	@IsOptional()
	@IsString()
	description?: string;
}

export class CreatureTierActionRollDto {
	@IsIn(['none', 'attack_profile', 'check'])
	type!: 'none' | 'attack_profile' | 'check';

	@IsOptional()
	@ValidateNested()
	@Type(() => CreatureTierActionReferenceDto)
	characteristic?: CreatureTierActionReferenceDto | null;

	@IsOptional()
	@ValidateNested()
	@Type(() => CreatureTierActionReferenceDto)
	skill?: CreatureTierActionReferenceDto | null;
}

export class CreatureTierActionDefenseDto {
	@IsIn(['none', 'target_physical_defense'])
	type!: 'none' | 'target_physical_defense';

	@IsOptional()
	@IsBoolean()
	canDodge?: boolean;

	@IsOptional()
	@IsBoolean()
	canParry?: boolean;
}

export class CreatureTierActionEffectDto {
	@IsIn([
		'damage',
		'apply_condition',
		'remove_condition',
		'create_grab',
		'release_grab',
		'move_with_grab',
		'dice_pool_modifier',
		'special_rule'
	])
	type!:
		| 'damage'
		| 'apply_condition'
		| 'remove_condition'
		| 'create_grab'
		| 'release_grab'
		| 'move_with_grab'
		| 'dice_pool_modifier'
		| 'special_rule';

	@IsOptional()
	@IsInt()
	value?: number | null;

	@IsOptional()
	@IsIn(['clean_successes', 'clean_successes_plus_base', 'base_damage'])
	damageMode?: 'clean_successes' | 'clean_successes_plus_base' | 'base_damage';

	@IsOptional()
	@ValidateNested()
	@Type(() => CreatureTierActionReferenceDto)
	damageType?: CreatureTierActionReferenceDto | null;

	@IsOptional()
	@ValidateNested()
	@Type(() => CreatureTierActionReferenceDto)
	condition?: CreatureTierActionReferenceDto | null;

	@IsOptional()
	@IsString()
	conditionDisplayName?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	conditionLevel?: number | null;

	@IsOptional()
	@IsIn([
		'holder',
		'source_against_holder',
		'source_group_against_holder',
		'all_creatures_against_holder'
	])
	targetScope?:
		| 'holder'
		| 'source_against_holder'
		| 'source_group_against_holder'
		| 'all_creatures_against_holder';

	@IsOptional()
	@IsBoolean()
	appliesArmor?: boolean;

	@IsOptional()
	@IsBoolean()
	requiresDamageAfterArmor?: boolean;

	@IsOptional()
	@IsString()
	text?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class CreatureTierActionDto {
	@IsString()
	slug!: string;

	@IsString()
	name!: string;

	@IsIn(['attack', 'grab_action', 'active_ability', 'reaction', 'passive'])
	kind!: 'attack' | 'grab_action' | 'active_ability' | 'reaction' | 'passive';

	@IsOptional()
	@ValidateNested()
	@Type(() => CreatureTierActionSourceDto)
	source?: CreatureTierActionSourceDto | null;

	@ValidateNested()
	@Type(() => CreatureTierActionCostDto)
	cost!: CreatureTierActionCostDto;

	@IsOptional()
	@ValidateNested()
	@Type(() => CreatureTierActionTargetDto)
	target?: CreatureTierActionTargetDto | null;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureTierAttackAvailabilityRuleDto)
	availabilityRules?: CreatureTierAttackAvailabilityRuleDto[];

	@IsOptional()
	@ValidateNested()
	@Type(() => CreatureTierActionRollDto)
	roll?: CreatureTierActionRollDto | null;

	@IsOptional()
	@ValidateNested()
	@Type(() => CreatureTierActionDefenseDto)
	defense?: CreatureTierActionDefenseDto | null;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureTierActionEffectDto)
	effects?: CreatureTierActionEffectDto[];

	@IsOptional()
	@IsString()
	playerText?: string;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class CreatureTierDto {
	@IsInt()
	@Min(1)
	@Max(5)
	tier!: number;

	@IsString()
	name!: string;

	@IsInt()
	@Min(1)
	hp!: number;

	@IsOptional()
	@IsUUID()
	sizeId?: string | null;

	@IsOptional()
	@IsUUID()
	armorPresetId?: string | null;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureTierAttackOverrideDto)
	attackOverrides?: CreatureTierAttackOverrideDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureTierAbilityDto)
	abilities?: CreatureTierAbilityDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureTierActionDto)
	actions?: CreatureTierActionDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureTierActionDto)
	actionOverrides?: CreatureTierActionDto[];

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureTierSkillDto)
	skills!: CreatureTierSkillDto[];

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreatureTierCharacteristicDto)
	characteristics!: CreatureTierCharacteristicDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
