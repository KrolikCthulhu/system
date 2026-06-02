import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateSkillDto {
	@IsString()
	name!: string;

	@IsUUID()
	categoryId!: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsUUID()
	rollConsequenceId?: string | null;

	@IsOptional()
	@IsUUID()
	dicePoolValueId?: string | null;

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
