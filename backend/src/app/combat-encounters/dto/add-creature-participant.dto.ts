import {
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Max,
	MaxLength,
	Min
} from 'class-validator';

export class AddCreatureParticipantDto {
	@IsUUID()
	creatureId!: string;

	@IsOptional()
	@IsUUID()
	creatureTierId?: string;

	@IsOptional()
	@IsString()
	@MaxLength(120)
	sceneName?: string;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(20)
	count?: number;
}
