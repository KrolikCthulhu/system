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
	conditionRepeatDurationModes,
	conditionRepeatLevelModes,
	conditionRemovalMethods,
	type ConditionDurationType,
	type ConditionEffectScope,
	type ConditionEffectType,
	type ConditionRepeatDurationMode,
	type ConditionRepeatLevelMode,
	type ConditionRemovalMethod
} from './condition-rules.constants';

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
