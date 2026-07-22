import {
	IsIn,
	IsOptional,
	IsString,
	MaxLength,
	MinLength
} from 'class-validator';

export const campaignMemberRoles = ['GM', 'PLAYER'] as const;

export class InviteCampaignMemberDto {
	@IsString()
	@MinLength(1)
	@MaxLength(255)
	identifier!: string;

	@IsOptional()
	@IsIn(campaignMemberRoles)
	role?: (typeof campaignMemberRoles)[number];
}
