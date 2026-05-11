import { IsString } from 'class-validator';

export class CreateSkillCategoryDto {
	@IsString()
	name!: string;

	@IsString()
	code!: string;

	@IsString()
	description!: string;
}
