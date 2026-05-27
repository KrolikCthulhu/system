import { IsBoolean } from 'class-validator';

export class UpdateAttributeActiveDto {
	@IsBoolean()
	isActive!: boolean;
}
