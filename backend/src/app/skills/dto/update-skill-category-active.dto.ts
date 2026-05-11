import { IsBoolean } from 'class-validator';

export class UpdateSkillCategoryActiveDto {
	@IsBoolean()
	isActive!: boolean;
}
