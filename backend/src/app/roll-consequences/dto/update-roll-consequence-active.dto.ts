import { IsBoolean } from 'class-validator';

export class UpdateRollConsequenceActiveDto {
	@IsBoolean()
	isActive!: boolean;
}
