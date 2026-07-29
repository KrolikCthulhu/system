export type CampaignMemberRole = 'GM' | 'PLAYER';
export type CampaignMemberStatus = 'INVITED' | 'ACTIVE' | 'LEFT';
export type CampaignCombatActionResolutionMode = 'delayed' | 'immediate';

export interface CampaignUser {
	id: string;
	username: string;
	displayUsername: string;
	email: string;
}

export interface CampaignMember {
	id: string;
	role: CampaignMemberRole;
	status: CampaignMemberStatus;
	invitedAt: string;
	joinedAt: string | null;
	user: CampaignUser;
}

export interface Campaign {
	id: string;
	name: string;
	description: string | null;
	combatActionResolutionMode: CampaignCombatActionResolutionMode;
	owner: CampaignUser;
	currentUserRole: CampaignMemberRole | null;
	currentUserStatus: CampaignMemberStatus | null;
	isActive: boolean;
	members: CampaignMember[];
	createdAt: string;
	updatedAt: string;
}
