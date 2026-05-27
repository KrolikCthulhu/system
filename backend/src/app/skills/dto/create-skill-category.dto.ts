import { IsOptional, IsString } from 'class-validator';

export class CreateSkillCategoryDto {
	@IsString()
	name!: string;

	@IsOptional()
	@IsString()
	description?: string;
}
