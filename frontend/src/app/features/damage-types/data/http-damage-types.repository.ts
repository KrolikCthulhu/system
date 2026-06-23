import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import {
	DamageType,
	DamageTypesCatalog
} from '../domain/damage-types.models';
import {
	CreateDamageTypeDto,
	DamageTypeDto,
	DamageTypesCatalogResponseDto,
	UpdateDamageTypeDto
} from './dto/damage-types.dto';
import { DamageTypesRepository } from './damage-types-repository.port';
import {
	mapDamageTypeDto,
	mapDamageTypesCatalogResponseDto
} from './mappers/damage-types.mapper';

@Injectable({ providedIn: 'root' })
export class HttpDamageTypesRepository implements DamageTypesRepository {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadCatalog(): Observable<DamageTypesCatalog> {
		return this.http
			.get<DamageTypesCatalogResponseDto>(`${this.baseUrl}/admin/damage-types`, {
				withCredentials: true
			})
			.pipe(
				map(mapDamageTypesCatalogResponseDto),
				catchError(handleApiError)
			);
	}

	createDamageType(command: CreateDamageTypeDto): Observable<DamageType> {
		return this.http
			.post<DamageTypeDto>(`${this.baseUrl}/admin/damage-types`, command, {
				withCredentials: true
			})
			.pipe(
				map(mapDamageTypeDto),
				catchError(handleApiError)
			);
	}

	updateDamageType(
		id: string,
		command: UpdateDamageTypeDto
	): Observable<DamageType> {
		return this.http
			.patch<DamageTypeDto>(`${this.baseUrl}/admin/damage-types/${id}`, command, {
				withCredentials: true
			})
			.pipe(
				map(mapDamageTypeDto),
				catchError(handleApiError)
			);
	}

	deleteDamageType(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/damage-types/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}
}
