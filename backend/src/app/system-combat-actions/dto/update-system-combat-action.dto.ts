import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSystemCombatActionDto {
	@IsOptional()
	@IsString()
	@MaxLength(120)
	label?: string;

	@IsOptional()
	@IsString()
	@MaxLength(1000)
	description?: string;

	@IsOptional()
	@IsString()
	@MaxLength(120)
	targetChoiceLabel?: string;

	@IsOptional()
	@IsString()
	@MaxLength(120)
	confirmationTitle?: string;
}
