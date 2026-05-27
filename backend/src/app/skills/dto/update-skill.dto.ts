import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class UpdateSkillDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsUUID()
	categoryId?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Max(12)
	defaultLevel?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Max(12)
	maxLevel?: number;

	@IsOptional()
	@IsBoolean()
	usesDefaultLevelRules?: boolean;
}
