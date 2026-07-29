import {
	IsIn,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID
} from 'class-validator';

export class ExecuteCombatActionDto {
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
	defenseRequestId!: string;

	@IsIn(['dodge', 'parry', 'none'])
	mode!: 'dodge' | 'parry' | 'none';

	@IsOptional()
	@IsString()
	skillSlug?: string | null;
}

export class ResolveDeclaredCombatActionDto {
	@IsString()
	@IsNotEmpty()
	declaredActionId!: string;
}
