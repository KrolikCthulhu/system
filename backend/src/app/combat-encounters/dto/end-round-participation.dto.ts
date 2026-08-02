import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class EndRoundParticipationDto {
	@IsUUID()
	requestId!: string;

	@IsInt()
	@Min(0)
	expectedVersion!: number;

	@IsUUID()
	@IsNotEmpty()
	actorParticipantId!: string;

	@IsString()
	@IsNotEmpty()
	actionSlug!: string;
}
