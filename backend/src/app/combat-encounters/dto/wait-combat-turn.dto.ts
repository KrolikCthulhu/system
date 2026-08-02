import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class WaitCombatTurnDto {
	@IsUUID()
	requestId!: string;

	@IsInt()
	@Min(0)
	expectedVersion!: number;

	@IsUUID()
	@IsNotEmpty()
	actorParticipantId!: string;

	@IsUUID()
	@IsNotEmpty()
	targetParticipantId!: string;

	@IsString()
	@IsNotEmpty()
	actionSlug!: string;
}
