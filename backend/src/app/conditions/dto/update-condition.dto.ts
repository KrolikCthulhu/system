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

export class UpdateConditionEffectDto {
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

export class UpdateConditionApplicationConditionConfigDto {
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

export class UpdateConditionApplicationConditionDto {
	@IsIn(conditionApplicationConditionTypes)
	type!: ConditionApplicationConditionType;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsObject()
	config?: UpdateConditionApplicationConditionConfigDto;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class UpdateConditionTextBlockDto {
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

export class UpdateConditionParameterDto {
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

export class UpdateConditionDto {
	@IsOptional()
	@IsString()
	name?: string;

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
	@Type(() => UpdateConditionEffectDto)
	effects?: UpdateConditionEffectDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpdateConditionApplicationConditionDto)
	applicationConditions?: UpdateConditionApplicationConditionDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpdateConditionParameterDto)
	parameters?: UpdateConditionParameterDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpdateConditionTextBlockDto)
	textBlocks?: UpdateConditionTextBlockDto[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
