import {
	IsIn,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	Min
} from 'class-validator';

export class ExecuteCombatActionDto {
	@IsUUID()
	requestId!: string;

	@IsInt()
	@Min(0)
	expectedVersion!: number;

	@IsUUID()
	actorParticipantId!: string;

	@IsString()
	actionSlug!: string;

	@IsOptional()
	@IsUUID()
	targetParticipantId?: string | null;
}

export class ResolveCombatDefenseDto {
	@IsUUID()
	requestId!: string;

	@IsInt()
	@Min(0)
	expectedVersion!: number;

	@IsUUID()
	defenseRequestId!: string;

	@IsIn(['dodge', 'parry', 'none'])
	mode!: 'dodge' | 'parry' | 'none';

	@IsOptional()
	@IsString()
	skillSlug?: string | null;
}

export class ResolveDeclaredCombatActionDto {
	@IsUUID()
	requestId!: string;

	@IsInt()
	@Min(0)
	expectedVersion!: number;

	@IsString()
	@IsNotEmpty()
	declaredActionId!: string;
}
