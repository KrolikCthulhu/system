import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import {
	CharacterSheetSandboxDraft,
	CharacterSheetSandboxRollResult
} from '../domain/character-sheet-sandbox.models';
import {
	CharacterSheetSandboxDraftDto,
	CharacterSheetSandboxRollDto
} from './dto/character-sheet-sandbox.dto';
import {
	mapCharacterSheetSandboxDraftDto,
	mapCharacterSheetSandboxRollDto
} from './mappers/character-sheet-sandbox.mapper';
import { CharacterSheetSandboxRepository } from './character-sheet-sandbox-repository.port';

@Injectable({ providedIn: 'root' })
export class HttpCharacterSheetSandboxRepository
	implements CharacterSheetSandboxRepository
{
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadDraft(): Observable<CharacterSheetSandboxDraft> {
		return this.http
			.get<CharacterSheetSandboxDraftDto>(
				`${this.baseUrl}/admin/character-sheet-sandbox`,
				{ withCredentials: true }
			)
			.pipe(
				map(mapCharacterSheetSandboxDraftDto),
				catchError(handleApiError)
			);
	}

	updateDraft(
		inputValues: Record<string, number>
	): Observable<CharacterSheetSandboxDraft> {
		return this.http
			.patch<CharacterSheetSandboxDraftDto>(
				`${this.baseUrl}/admin/character-sheet-sandbox`,
				{ inputValues },
				{ withCredentials: true }
			)
			.pipe(
				map(mapCharacterSheetSandboxDraftDto),
				catchError(handleApiError)
			);
	}

	rollSkill(
		skillId: string,
		inputValues: Record<string, number>
	): Observable<CharacterSheetSandboxRollResult> {
		return this.http
			.post<CharacterSheetSandboxRollDto>(
				`${this.baseUrl}/admin/character-sheet-sandbox/roll`,
				{ skillId, inputValues },
				{ withCredentials: true }
			)
			.pipe(
				map(mapCharacterSheetSandboxRollDto),
				catchError(handleApiError)
			);
	}
}
