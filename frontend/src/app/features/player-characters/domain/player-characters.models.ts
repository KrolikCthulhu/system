export type PlayerCharacterStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface PlayerCharacterUser {
	id: string;
	username: string;
	displayUsername: string;
	email: string;
}

export interface PlayerCharacter {
	id: string;
	campaignId: string;
	campaignName: string;
	ownerUserId: string;
	owner: PlayerCharacterUser;
	name: string;
	status: PlayerCharacterStatus;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}
