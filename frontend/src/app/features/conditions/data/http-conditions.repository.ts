import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import {
	Condition,
	ConditionsCatalog
} from '../domain/conditions.models';
import {
	ConditionDto,
	ConditionsCatalogResponseDto,
	CreateConditionDto,
	UpdateConditionDto
} from './dto/conditions.dto';
import { ConditionsRepository } from './conditions-repository.port';
import {
	mapConditionDto,
	mapConditionsCatalogResponseDto
} from './mappers/conditions.mapper';

@Injectable({ providedIn: 'root' })
export class HttpConditionsRepository implements ConditionsRepository {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadCatalog(): Observable<ConditionsCatalog> {
		return this.http
			.get<ConditionsCatalogResponseDto>(`${this.baseUrl}/admin/conditions`, {
				withCredentials: true
			})
			.pipe(
				map(mapConditionsCatalogResponseDto),
				catchError(handleApiError)
			);
	}

	createCondition(command: CreateConditionDto): Observable<Condition> {
		return this.http
			.post<ConditionDto>(`${this.baseUrl}/admin/conditions`, command, {
				withCredentials: true
			})
			.pipe(
				map(mapConditionDto),
				catchError(handleApiError)
			);
	}

	updateCondition(
		id: string,
		command: UpdateConditionDto
	): Observable<Condition> {
		return this.http
			.patch<ConditionDto>(`${this.baseUrl}/admin/conditions/${id}`, command, {
				withCredentials: true
			})
			.pipe(
				map(mapConditionDto),
				catchError(handleApiError)
			);
	}

	deleteCondition(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/conditions/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}
}
