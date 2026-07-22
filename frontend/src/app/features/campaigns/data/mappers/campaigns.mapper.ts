import {
	Campaign,
	CampaignMember,
	CampaignUser
} from '../../domain/campaigns.models';
import {
	CampaignDto,
	CampaignMemberDto,
	CampaignsResponseDto,
	CampaignUserDto
} from '../dto/campaigns.dto';

export function mapCampaignsResponseDto(dto: CampaignsResponseDto): Campaign[] {
	return dto.campaigns.map(mapCampaignDto);
}

export function mapCampaignDto(dto: CampaignDto): Campaign {
	return {
		id: dto.id,
		name: dto.name,
		description: dto.description,
		owner: mapCampaignUserDto(dto.owner),
		currentUserRole: dto.currentUserRole,
		currentUserStatus: dto.currentUserStatus,
		isActive: dto.isActive,
		members: dto.members.map(mapCampaignMemberDto),
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}

function mapCampaignMemberDto(dto: CampaignMemberDto): CampaignMember {
	return {
		id: dto.id,
		role: dto.role,
		status: dto.status,
		invitedAt: dto.invitedAt,
		joinedAt: dto.joinedAt,
		user: mapCampaignUserDto(dto.user)
	};
}

function mapCampaignUserDto(dto: CampaignUserDto): CampaignUser {
	return {
		id: dto.id,
		username: dto.username,
		displayUsername: dto.displayUsername,
		email: dto.email
	};
}
