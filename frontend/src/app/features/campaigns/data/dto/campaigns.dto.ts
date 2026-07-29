import {
	CampaignCombatActionResolutionMode,
	CampaignMemberRole,
	CampaignMemberStatus
} from '../../domain/campaigns.models';

export interface CampaignUserDto {
	id: string;
	username: string;
	displayUsername: string;
	email: string;
}

export interface CampaignMemberDto {
	id: string;
	role: CampaignMemberRole;
	status: CampaignMemberStatus;
	invitedAt: string;
	joinedAt: string | null;
	user: CampaignUserDto;
}

export interface CampaignDto {
	id: string;
	name: string;
	description: string | null;
	combatActionResolutionMode: CampaignCombatActionResolutionMode;
	owner: CampaignUserDto;
	currentUserRole: CampaignMemberRole | null;
	currentUserStatus: CampaignMemberStatus | null;
	isActive: boolean;
	members: CampaignMemberDto[];
	createdAt: string;
	updatedAt: string;
}

export interface CampaignsResponseDto {
	campaigns: CampaignDto[];
}

export interface CreateCampaignDto {
	name: string;
	description?: string;
}

export interface InviteCampaignMemberDto {
	identifier: string;
	role?: CampaignMemberRole;
}

export interface UpdateCampaignSettingsDto {
	combatActionResolutionMode: CampaignCombatActionResolutionMode;
}
