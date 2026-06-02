import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateManualSystemValueDto {
	@IsString()
	@MinLength(1)
	@MaxLength(120)
	name!: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	description?: string;

	@IsOptional()
	@IsString()
	@MaxLength(120)
	displaySection?: string;
}
