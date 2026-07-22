import { IsUUID } from 'class-validator';

export class AddPlayerCharacterParticipantDto {
	@IsUUID()
	playerCharacterId!: string;
}
