import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCombatIntentDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	category?: string;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	sortOrder?: number;
}
