export const campaignMemberRoles = {
	gm: 'GM',
	player: 'PLAYER'
} as const;

export type CampaignMemberRole =
	(typeof campaignMemberRoles)[keyof typeof campaignMemberRoles];

export const campaignMemberStatuses = {
	invited: 'INVITED',
	active: 'ACTIVE',
	left: 'LEFT'
} as const;

export type CampaignMemberStatus =
	(typeof campaignMemberStatuses)[keyof typeof campaignMemberStatuses];

export const combatEncounterStatuses = {
	draft: 'DRAFT',
	active: 'ACTIVE',
	completed: 'COMPLETED'
} as const;

export type CombatEncounterStatus =
	(typeof combatEncounterStatuses)[keyof typeof combatEncounterStatuses];
