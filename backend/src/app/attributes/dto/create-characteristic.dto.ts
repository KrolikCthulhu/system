import {
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Min
} from 'class-validator';

export class CreateCharacteristicDto {
	@IsString()
	name!: string;

	@IsUUID()
	attributeId!: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsInt()
	minValue!: number;

	@IsInt()
	maxValue!: number;

	@IsInt()
	defaultValue!: number;

	@IsInt()
	@Min(0)
	sortOrder!: number;
}
