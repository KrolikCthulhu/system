import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import {
	CombatEncounter,
	CombatEncounterSummary,
	KnockdownSizeRuleResult
} from '../domain/combat-encounters.models';
import { CombatEncountersRepository } from './combat-encounters-repository.port';
import {
	AddCreatureParticipantDto,
	AddPlayerCharacterParticipantDto,
	CombatEncounterDto,
	CombatEncountersResponseDto,
	CreateCombatEncounterDto,
	ExecuteCombatActionDto,
	KnockdownSizeRuleResultDto,
	ResolveCombatDefenseDto,
	ResolveDeclaredCombatActionDto,
	UpdateCombatEncounterDto,
	UpdateCombatParticipantDto
} from './dto/combat-encounters.dto';
import {
	mapCombatEncounterDto,
	mapCombatEncountersResponseDto
} from './mappers/combat-encounters.mapper';

@Injectable({ providedIn: 'root' })
export class HttpCombatEncountersRepository
	implements CombatEncountersRepository
{
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadCampaignEncounters(
		campaignId: string
	): Observable<CombatEncounterSummary[]> {
		return this.http
			.get<CombatEncountersResponseDto>(
				`${this.baseUrl}/campaigns/${campaignId}/combat-encounters`,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCombatEncountersResponseDto), catchError(handleApiError));
	}

	createEncounter(
		campaignId: string,
		command: CreateCombatEncounterDto
	): Observable<CombatEncounter> {
		return this.http
			.post<CombatEncounterDto>(
				`${this.baseUrl}/campaigns/${campaignId}/combat-encounters`,
				command,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCombatEncounterDto), catchError(handleApiError));
	}

	loadEncounter(id: string): Observable<CombatEncounter> {
		return this.http
			.get<CombatEncounterDto>(`${this.baseUrl}/combat-encounters/${id}`, {
				withCredentials: true
			})
			.pipe(map(mapCombatEncounterDto), catchError(handleApiError));
	}

	updateEncounter(
		id: string,
		command: UpdateCombatEncounterDto
	): Observable<CombatEncounter> {
		return this.http
			.patch<CombatEncounterDto>(
				`${this.baseUrl}/combat-encounters/${id}`,
				command,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCombatEncounterDto), catchError(handleApiError));
	}

	addPlayerCharacter(
		id: string,
		command: AddPlayerCharacterParticipantDto
	): Observable<CombatEncounter> {
		return this.http
			.post<CombatEncounterDto>(
				`${this.baseUrl}/combat-encounters/${id}/player-characters`,
				command,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCombatEncounterDto), catchError(handleApiError));
	}

	addCreature(
		id: string,
		command: AddCreatureParticipantDto
	): Observable<CombatEncounter> {
		return this.http
			.post<CombatEncounterDto>(
				`${this.baseUrl}/combat-encounters/${id}/creatures`,
				command,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCombatEncounterDto), catchError(handleApiError));
	}

	updateParticipant(
		id: string,
		participantId: string,
		command: UpdateCombatParticipantDto
	): Observable<CombatEncounter> {
		return this.http
			.patch<CombatEncounterDto>(
				`${this.baseUrl}/combat-encounters/${id}/participants/${participantId}`,
				command,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCombatEncounterDto), catchError(handleApiError));
	}

	skipParticipantTurn(
		id: string,
		participantId: string,
		command: { expectedVersion: number }
	): Observable<CombatEncounter> {
		return this.http
			.post<CombatEncounterDto>(
				`${this.baseUrl}/combat-encounters/${id}/participants/${participantId}/skip-turn`,
				this.withRequestId(command),
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCombatEncounterDto), catchError(handleApiError));
	}

	resolveKnockdownSizeRule(
		id: string,
		attackerParticipantId: string,
		targetParticipantId: string
	): Observable<KnockdownSizeRuleResult> {
		return this.http
			.get<KnockdownSizeRuleResultDto>(
				`${this.baseUrl}/combat-encounters/${id}/rules/knockdown-size`,
				{
					params: {
						attackerParticipantId,
						targetParticipantId
					},
					withCredentials: true
				}
			)
			.pipe(catchError(handleApiError));
	}

	executeAction(
		id: string,
		command: ExecuteCombatActionDto
	): Observable<CombatEncounter> {
		return this.http
			.post<CombatEncounterDto>(
				`${this.baseUrl}/combat-encounters/${id}/actions/execute`,
				this.withRequestId(command),
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCombatEncounterDto), catchError(handleApiError));
	}

	resolveDefense(
		id: string,
		command: ResolveCombatDefenseDto
	): Observable<CombatEncounter> {
		return this.http
			.post<CombatEncounterDto>(
				`${this.baseUrl}/combat-encounters/${id}/defenses/resolve`,
				this.withRequestId(command),
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCombatEncounterDto), catchError(handleApiError));
	}

	resolveDeclaredAction(
		id: string,
		command: ResolveDeclaredCombatActionDto
	): Observable<CombatEncounter> {
		return this.http
			.post<CombatEncounterDto>(
				`${this.baseUrl}/combat-encounters/${id}/actions/resolve-declared`,
				this.withRequestId(command),
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCombatEncounterDto), catchError(handleApiError));
	}

	private withRequestId<TCommand extends object>(command: TCommand) {
		return {
			...command,
			requestId: this.createRequestId()
		};
	}

	private createRequestId() {
		return crypto.randomUUID();
	}
}
