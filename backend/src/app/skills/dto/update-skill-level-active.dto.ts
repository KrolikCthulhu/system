import { IsBoolean } from 'class-validator';

export class UpdateSkillLevelActiveDto {
	@IsBoolean()
	isActive!: boolean;
}
