import { IsBoolean } from 'class-validator';

export class UpdateSkillActiveDto {
	@IsBoolean()
	isActive!: boolean;
}
