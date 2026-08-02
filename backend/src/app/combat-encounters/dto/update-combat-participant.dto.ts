import {
	IsBoolean,
	IsInt,
	IsOptional,
	IsString,
	MaxLength,
	Min
} from 'class-validator';

export class UpdateCombatParticipantDto {
	@IsOptional()
	@IsString()
	@MaxLength(120)
	sceneName?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	currentHealth?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	currentPotential?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	currentSpeed?: number;

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;
}
