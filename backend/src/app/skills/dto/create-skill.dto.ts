import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateSkillDto {
	@IsString()
	name!: string;

	@IsString()
	code!: string;

	@IsUUID()
	categoryId!: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsInt()
	@Min(0)
	@Max(12)
	defaultLevel!: number;

	@IsInt()
	@Min(0)
	@Max(12)
	maxLevel!: number;

	@IsBoolean()
	usesDefaultLevelRules!: boolean;
}
