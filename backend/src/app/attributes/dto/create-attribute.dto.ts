import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateAttributeDto {
	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsUUID()
	poolPenaltyValueId?: string | null;

	@IsInt()
	@Min(0)
	sortOrder!: number;
}
