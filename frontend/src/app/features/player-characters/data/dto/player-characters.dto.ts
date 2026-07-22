import { PlayerCharacterStatus } from '../../domain/player-characters.models';

export interface PlayerCharacterUserDto {
	id: string;
	username: string;
	displayUsername: string;
	email: string;
}

export interface PlayerCharacterDto {
	id: string;
	campaignId: string;
	campaignName: string;
	ownerUserId: string;
	owner: PlayerCharacterUserDto;
	name: string;
	status: PlayerCharacterStatus;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface PlayerCharactersResponseDto {
	characters: PlayerCharacterDto[];
}

export interface CreatePlayerCharacterDto {
	name: string;
}

export interface UpdatePlayerCharacterDto {
	name?: string;
}
