import {
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Min
} from 'class-validator';

export class UpdateCharacteristicDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsUUID()
	attributeId?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsInt()
	minValue?: number;

	@IsOptional()
	@IsInt()
	maxValue?: number;

	@IsOptional()
	@IsInt()
	defaultValue?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
