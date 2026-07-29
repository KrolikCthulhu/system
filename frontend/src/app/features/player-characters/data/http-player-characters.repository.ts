import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import {
	CharacterSheetSandboxDraft,
	CharacterSheetSandboxRollResult
} from '../../character-sheet/domain/character-sheet-sandbox.models';
import {
	CharacterSheetSandboxDraftDto,
	CharacterSheetSandboxRollDto
} from '../../character-sheet/data/dto/character-sheet-sandbox.dto';
import {
	mapCharacterSheetSandboxDraftDto,
	mapCharacterSheetSandboxRollDto
} from '../../character-sheet/data/mappers/character-sheet-sandbox.mapper';
import {
	PlayerCharacter,
	PlayerCharacterSummary
} from '../domain/player-characters.models';
import {
	CreatePlayerCharacterDto,
	PlayerCharacterDto,
	PlayerCharactersResponseDto,
	UpdatePlayerCharacterDto
} from './dto/player-characters.dto';
import {
	mapPlayerCharacterDto,
	mapPlayerCharactersResponseDto
} from './mappers/player-characters.mapper';
import { PlayerCharactersRepository } from './player-characters-repository.port';

@Injectable({ providedIn: 'root' })
export class HttpPlayerCharactersRepository
	implements PlayerCharactersRepository
{
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadCampaignCharacters(
		campaignId: string
	): Observable<PlayerCharacterSummary[]> {
		return this.http
			.get<PlayerCharactersResponseDto>(
				`${this.baseUrl}/campaigns/${campaignId}/characters`,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapPlayerCharactersResponseDto), catchError(handleApiError));
	}

	createCharacter(
		campaignId: string,
		command: CreatePlayerCharacterDto
	): Observable<PlayerCharacter> {
		return this.http
			.post<PlayerCharacterDto>(
				`${this.baseUrl}/campaigns/${campaignId}/characters`,
				command,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapPlayerCharacterDto), catchError(handleApiError));
	}

	loadCharacter(id: string): Observable<PlayerCharacter> {
		return this.http
			.get<PlayerCharacterDto>(`${this.baseUrl}/player-characters/${id}`, {
				withCredentials: true
			})
			.pipe(map(mapPlayerCharacterDto), catchError(handleApiError));
	}

	updateCharacter(
		id: string,
		command: UpdatePlayerCharacterDto
	): Observable<PlayerCharacter> {
		return this.http
			.patch<PlayerCharacterDto>(
				`${this.baseUrl}/player-characters/${id}`,
				command,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapPlayerCharacterDto), catchError(handleApiError));
	}

	loadSheet(id: string): Observable<CharacterSheetSandboxDraft> {
		return this.http
			.get<CharacterSheetSandboxDraftDto>(
				`${this.baseUrl}/player-characters/${id}/sheet`,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCharacterSheetSandboxDraftDto), catchError(handleApiError));
	}

	updateSheet(
		id: string,
		inputValues: Record<string, number>
	): Observable<CharacterSheetSandboxDraft> {
		return this.http
			.patch<CharacterSheetSandboxDraftDto>(
				`${this.baseUrl}/player-characters/${id}/sheet`,
				{ inputValues },
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCharacterSheetSandboxDraftDto), catchError(handleApiError));
	}

	rollSkill(
		id: string,
		skillId: string,
		inputValues: Record<string, number>
	): Observable<CharacterSheetSandboxRollResult> {
		return this.http
			.post<CharacterSheetSandboxRollDto>(
				`${this.baseUrl}/player-characters/${id}/sheet/roll`,
				{ skillId, inputValues },
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCharacterSheetSandboxRollDto), catchError(handleApiError));
	}
}
