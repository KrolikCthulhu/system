import {
	PlayerCharacter,
	PlayerCharacterSummary,
	PlayerCharacterUser
} from '../../domain/player-characters.models';
import {
	PlayerCharacterDto,
	PlayerCharactersResponseDto,
	PlayerCharacterUserDto
} from '../dto/player-characters.dto';

export function mapPlayerCharactersResponseDto(
	dto: PlayerCharactersResponseDto
): PlayerCharacterSummary[] {
	return dto.characters.map(mapPlayerCharacterDto);
}

export function mapPlayerCharacterDto(
	dto: PlayerCharacterDto
): PlayerCharacter {
	return {
		id: dto.id,
		campaignId: dto.campaignId,
		campaignName: dto.campaignName,
		ownerUserId: dto.ownerUserId,
		owner: mapPlayerCharacterUserDto(dto.owner),
		name: dto.name,
		status: dto.status,
		isActive: dto.isActive,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}

function mapPlayerCharacterUserDto(
	dto: PlayerCharacterUserDto
): PlayerCharacterUser {
	return {
		id: dto.id,
		username: dto.username,
		displayUsername: dto.displayUsername,
		email: dto.email
	};
}
