import { IsBoolean } from 'class-validator';

export class UpdateCharacteristicActiveDto {
	@IsBoolean()
	isActive!: boolean;
}
