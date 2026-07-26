import { Type } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsIn,
	IsInt,
	IsObject,
	IsOptional,
	IsString,
	Min,
	ValidateNested
} from 'class-validator';
import {
	conditionDurationTypes,
	conditionEffectScopes,
	conditionEffectTypes,
	conditionApplicationConditionTypes,
	conditionDuplicateInstanceModes,
	conditionInstanceLimitModes,
	conditionInstanceModes,
	conditionInstanceOverflowModes,
	conditionInstanceUniquenessModes,
	conditionParameterTypes,
	conditionParameterValueSources,
	conditionRepeatDurationModes,
	conditionRepeatLevelModes,
	conditionRemovalMethods,
	type ConditionDurationType,
	type ConditionEffectScope,
	type ConditionEffectType,
	type ConditionApplicationConditionType,
	type ConditionDuplicateInstanceMode,
	type ConditionInstanceLimitMode,
	type ConditionInstanceMode,
	type ConditionInstanceOverflowMode,
	type ConditionInstanceUniquenessMode,
	type ConditionParameterType,
	type ConditionParameterValueSource,
	type ConditionRuleTemplateType,
	type ConditionRepeatDurationMode,
	type ConditionRepeatLevelMode,
	type ConditionRemovalMethod
} from './condition-rules.constants';

type ConditionParameterDefaultValue =
	| string
	| number
	| boolean
	| {
			template: ConditionRuleTemplateType;
			checkName?: string;
			potentialCost?: number;
			difficulty?: number;
	  };

export class ConditionEffectDto {
	@IsIn(conditionEffectTypes)
	type!: ConditionEffectType;

	@IsIn(conditionEffectScopes)
	scope!: ConditionEffectScope;

	@IsOptional()
	@IsInt()
	value?: number;

	@IsOptional()
	@IsObject()
	config?: Record<string, unknown>;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class ConditionApplicationConditionConfigDto {
	@IsOptional()
	@IsString()
	conditionId?: string;

	@IsOptional()
	@IsString()
	sizeMode?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	sizeDelta?: number;
}

export class ConditionApplicationConditionDto {
	@IsIn(conditionApplicationConditionTypes)
	type!: ConditionApplicationConditionType;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsObject()
	config?: ConditionApplicationConditionConfigDto;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class ConditionTextBlockDto {
	@IsString()
	kind!: string;

	@IsOptional()
	@IsString()
	text?: string;

	@IsOptional()
	@IsString()
	token?: string;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class ConditionParameterDto {
	@IsString()
	key!: string;

	@IsString()
	label!: string;

	@IsIn(conditionParameterTypes)
	type!: ConditionParameterType;

	@IsOptional()
	@IsIn(conditionParameterValueSources)
	valueSource?: ConditionParameterValueSource;

	@IsOptional()
	@IsBoolean()
	isRequired?: boolean;

	@IsOptional()
	defaultValue?: ConditionParameterDefaultValue;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class CreateConditionDto {
	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsIn(conditionDurationTypes)
	durationType?: ConditionDurationType;

	@IsOptional()
	@IsIn(conditionRepeatLevelModes)
	repeatLevelMode?: ConditionRepeatLevelMode;

	@IsOptional()
	@IsIn(conditionRepeatDurationModes)
	repeatDurationMode?: ConditionRepeatDurationMode;

	@IsOptional()
	@IsIn(conditionInstanceModes)
	instanceMode?: ConditionInstanceMode;

	@IsOptional()
	@IsIn(conditionInstanceLimitModes)
	instanceLimitMode?: ConditionInstanceLimitMode;

	@IsOptional()
	@IsInt()
	@Min(1)
	maxInstances?: number;

	@IsOptional()
	@IsIn(conditionInstanceOverflowModes)
	instanceOverflowMode?: ConditionInstanceOverflowMode;

	@IsOptional()
	@IsIn(conditionInstanceUniquenessModes)
	instanceUniquenessMode?: ConditionInstanceUniquenessMode;

	@IsOptional()
	@IsIn(conditionDuplicateInstanceModes)
	duplicateInstanceMode?: ConditionDuplicateInstanceMode;

	@IsOptional()
	@IsInt()
	@Min(1)
	maxLevel?: number;

	@IsOptional()
	@IsArray()
	@IsIn(conditionRemovalMethods, { each: true })
	removalMethods?: ConditionRemovalMethod[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ConditionEffectDto)
	effects?: ConditionEffectDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ConditionApplicationConditionDto)
	applicationConditions?: ConditionApplicationConditionDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ConditionParameterDto)
	parameters?: ConditionParameterDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ConditionTextBlockDto)
	textBlocks?: ConditionTextBlockDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
