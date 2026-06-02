import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateAttributeDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsUUID()
	poolPenaltyValueId?: string | null;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
