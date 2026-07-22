import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Campaign, CampaignMemberRole } from '../domain/campaigns.models';

export interface CampaignsRepository {
	loadCampaigns(): Observable<Campaign[]>;
	createCampaign(command: {
		name: string;
		description?: string;
	}): Observable<Campaign>;
	inviteMember(
		campaignId: string,
		command: {
			identifier: string;
			role?: CampaignMemberRole;
		}
	): Observable<Campaign>;
	acceptInvitation(campaignId: string): Observable<Campaign>;
	leaveCampaign(campaignId: string): Observable<void>;
}

export const CAMPAIGNS_REPOSITORY = new InjectionToken<CampaignsRepository>(
	'CAMPAIGNS_REPOSITORY'
);
