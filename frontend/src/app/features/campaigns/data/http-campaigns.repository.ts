import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import { Campaign } from '../domain/campaigns.models';
import { CampaignsRepository } from './campaigns-repository.port';
import {
	CampaignDto,
	CampaignsResponseDto,
	CreateCampaignDto,
	InviteCampaignMemberDto,
	UpdateCampaignSettingsDto
} from './dto/campaigns.dto';
import {
	mapCampaignDto,
	mapCampaignsResponseDto
} from './mappers/campaigns.mapper';

@Injectable({ providedIn: 'root' })
export class HttpCampaignsRepository implements CampaignsRepository {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadCampaigns(): Observable<Campaign[]> {
		return this.http
			.get<CampaignsResponseDto>(`${this.baseUrl}/campaigns`, {
				withCredentials: true
			})
			.pipe(map(mapCampaignsResponseDto), catchError(handleApiError));
	}

	createCampaign(command: CreateCampaignDto): Observable<Campaign> {
		return this.http
			.post<CampaignDto>(`${this.baseUrl}/campaigns`, command, {
				withCredentials: true
			})
			.pipe(map(mapCampaignDto), catchError(handleApiError));
	}

	inviteMember(
		campaignId: string,
		command: InviteCampaignMemberDto
	): Observable<Campaign> {
		return this.http
			.post<CampaignDto>(
				`${this.baseUrl}/campaigns/${campaignId}/invitations`,
				command,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCampaignDto), catchError(handleApiError));
	}

	acceptInvitation(campaignId: string): Observable<Campaign> {
		return this.http
			.post<CampaignDto>(
				`${this.baseUrl}/campaigns/${campaignId}/accept`,
				{},
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCampaignDto), catchError(handleApiError));
	}

	updateSettings(
		campaignId: string,
		command: UpdateCampaignSettingsDto
	): Observable<Campaign> {
		return this.http
			.patch<CampaignDto>(
				`${this.baseUrl}/campaigns/${campaignId}/settings`,
				command,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCampaignDto), catchError(handleApiError));
	}

	leaveCampaign(campaignId: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/campaigns/${campaignId}/members/me`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}
}
