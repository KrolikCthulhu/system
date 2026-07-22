import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCombatEncounterDto {
	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(120)
	name?: string;
}
