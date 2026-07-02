import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import {
	CreatureType,
	CreatureTypesCatalog
} from '../domain/creature-types.models';
import { CreatureTypesRepository } from './creature-types-repository.port';
import {
	CreateCreatureTypeDto,
	CreatureTypeDto,
	CreatureTypesCatalogResponseDto,
	UpdateCreatureTypeDto
} from './dto/creature-types.dto';
import {
	mapCreatureTypeDto,
	mapCreatureTypesCatalogResponseDto
} from './mappers/creature-types.mapper';

@Injectable({ providedIn: 'root' })
export class HttpCreatureTypesRepository implements CreatureTypesRepository {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadCatalog(): Observable<CreatureTypesCatalog> {
		return this.http
			.get<CreatureTypesCatalogResponseDto>(
				`${this.baseUrl}/admin/creature-types`,
				{
					withCredentials: true
				}
			)
			.pipe(
				map(mapCreatureTypesCatalogResponseDto),
				catchError(handleApiError)
			);
	}

	createCreatureType(command: CreateCreatureTypeDto): Observable<CreatureType> {
		return this.http
			.post<CreatureTypeDto>(`${this.baseUrl}/admin/creature-types`, command, {
				withCredentials: true
			})
			.pipe(map(mapCreatureTypeDto), catchError(handleApiError));
	}

	updateCreatureType(
		id: string,
		command: UpdateCreatureTypeDto
	): Observable<CreatureType> {
		return this.http
			.patch<CreatureTypeDto>(
				`${this.baseUrl}/admin/creature-types/${id}`,
				command,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapCreatureTypeDto), catchError(handleApiError));
	}

	deleteCreatureType(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/creature-types/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}
}
