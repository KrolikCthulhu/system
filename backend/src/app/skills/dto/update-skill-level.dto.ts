import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateSkillLevelDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsBoolean()
	canRoll?: boolean;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(6)
	successMin?: number | null;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(6)
	doubleSuccessMin?: number | null;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Max(6)
	ignoreOnesCount?: number;

	@IsOptional()
	@IsString()
	ruleText?: string | null;
}
