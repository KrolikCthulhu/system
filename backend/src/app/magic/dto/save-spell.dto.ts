import {
	IsBoolean,
	IsEnum,
	IsInt,
	IsObject,
	IsOptional,
	IsArray,
	ValidateNested,
	IsString,
	IsUUID,
	Min
} from 'class-validator';
import { Type } from 'class-transformer';
import { SpellStatus } from '@prisma/generated';

export class SaveSpellMechanicBlockDto {
	@IsOptional()
	@IsUUID('4')
	id?: string;

	@IsUUID('4')
	mechanicId!: string;

	@IsOptional()
	@IsObject()
	parameterValues?: Record<string, unknown>;

	@IsOptional()
	@IsObject()
	config?: Record<string, unknown>;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class SaveSpellTargetConfigDto {
	@IsString()
	id!: string;

	@IsString()
	name!: string;

	@IsString()
	source!: string;

	@IsString()
	relation!: string;

	@IsString()
	countMode!: string;

	@IsOptional()
	@IsString()
	countValueMode?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	countValue?: number;

	@IsOptional()
	@IsString()
	countFormula?: string;

	@IsOptional()
	@IsString()
	targetCountParameterId?: string;

	@IsOptional()
	@IsBoolean()
	isRequired?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class SaveSpellTextBlockDto {
	@IsString()
	id!: string;

	@IsString()
	kind!: string;

	@IsOptional()
	@IsString()
	text?: string;

	@IsOptional()
	@IsString()
	mechanicBlockId?: string;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}

export class SaveSpellDto {
	@IsOptional()
	@IsUUID('4')
	actionId?: string;

	@IsOptional()
	@IsUUID('4')
	essenceId?: string;

	@IsOptional()
	@IsUUID('4')
	gestureId?: string;

	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsObject()
	config?: Record<string, unknown>;

	@IsEnum(SpellStatus)
	status!: SpellStatus;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SaveSpellTargetConfigDto)
	targetConfigs?: SaveSpellTargetConfigDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SaveSpellTextBlockDto)
	textBlocks?: SaveSpellTextBlockDto[];

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SaveSpellMechanicBlockDto)
	mechanicBlocks?: SaveSpellMechanicBlockDto[];
}
