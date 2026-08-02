import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import {
	SystemCombatAction,
	SystemCombatActionsCatalog
} from '../domain/system-combat-actions.models';
import {
	SystemCombatActionDto,
	SystemCombatActionsCatalogResponseDto,
	UpdateSystemCombatActionDto
} from './dto/system-combat-actions.dto';
import {
	mapSystemCombatActionDto,
	mapSystemCombatActionsCatalogResponseDto
} from './mappers/system-combat-actions.mapper';
import { SystemCombatActionsRepository } from './system-combat-actions-repository.port';

@Injectable({ providedIn: 'root' })
export class HttpSystemCombatActionsRepository
	implements SystemCombatActionsRepository
{
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadCatalog(): Observable<SystemCombatActionsCatalog> {
		return this.http
			.get<SystemCombatActionsCatalogResponseDto>(
				`${this.baseUrl}/admin/system-combat-actions`,
				{
					withCredentials: true
				}
			)
			.pipe(
				map(mapSystemCombatActionsCatalogResponseDto),
				catchError(handleApiError)
			);
	}

	updateAction(
		id: string,
		command: UpdateSystemCombatActionDto
	): Observable<SystemCombatAction> {
		return this.http
			.patch<SystemCombatActionDto>(
				`${this.baseUrl}/admin/system-combat-actions/${id}`,
				command,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapSystemCombatActionDto), catchError(handleApiError));
	}
}
