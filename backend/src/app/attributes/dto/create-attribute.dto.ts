import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateAttributeDto {
	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsInt()
	@Min(0)
	sortOrder!: number;
}
