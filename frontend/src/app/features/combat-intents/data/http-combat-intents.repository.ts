import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import {
	CombatIntent,
	CombatIntentsCatalog
} from '../domain/combat-intents.models';
import {
	CombatIntentDto,
	CombatIntentsCatalogResponseDto,
	CreateCombatIntentDto,
	UpdateCombatIntentDto
} from './dto/combat-intents.dto';
import {
	mapCombatIntentDto,
	mapCombatIntentsCatalogResponseDto
} from './mappers/combat-intents.mapper';
import { CombatIntentsRepository } from './combat-intents-repository.port';

@Injectable({ providedIn: 'root' })
export class HttpCombatIntentsRepository
	implements CombatIntentsRepository
{
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadCatalog(): Observable<CombatIntentsCatalog> {
		return this.http
			.get<CombatIntentsCatalogResponseDto>(
				`${this.baseUrl}/admin/combat-intents`,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCombatIntentsCatalogResponseDto), catchError(handleApiError));
	}

	createCombatIntent(command: CreateCombatIntentDto): Observable<CombatIntent> {
		return this.http
			.post<CombatIntentDto>(`${this.baseUrl}/admin/combat-intents`, command, {
				withCredentials: true
			})
			.pipe(map(mapCombatIntentDto), catchError(handleApiError));
	}

	updateCombatIntent(
		id: string,
		command: UpdateCombatIntentDto
	): Observable<CombatIntent> {
		return this.http
			.patch<CombatIntentDto>(
				`${this.baseUrl}/admin/combat-intents/${id}`,
				command,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCombatIntentDto), catchError(handleApiError));
	}

	deleteCombatIntent(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/combat-intents/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}
}
