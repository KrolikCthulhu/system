import { Provider } from '@angular/core';
import { CAMPAIGNS_REPOSITORY } from './campaigns-repository.port';
import { HttpCampaignsRepository } from './http-campaigns.repository';

export function provideCampaignsInfrastructure(): Provider[] {
	return [
		HttpCampaignsRepository,
		{
			provide: CAMPAIGNS_REPOSITORY,
			useExisting: HttpCampaignsRepository
		}
	];
}
