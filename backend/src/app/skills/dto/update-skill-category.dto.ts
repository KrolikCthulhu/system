import { IsOptional, IsString } from 'class-validator';

export class UpdateSkillCategoryDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	code?: string;

	@IsOptional()
	@IsString()
	description?: string;
}
