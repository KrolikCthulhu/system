import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

export class EnterDefenseStanceDto {
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
