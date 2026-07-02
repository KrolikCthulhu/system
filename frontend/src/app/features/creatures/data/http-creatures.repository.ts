import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import { Creature, CreaturesCatalog } from '../domain/creatures.models';
import { CreaturesRepository } from './creatures-repository.port';
import {
	CreateCreatureDto,
	CreatureDto,
	CreaturesCatalogResponseDto,
	UpdateCreatureDto
} from './dto/creatures.dto';
import {
	mapCreatureDto,
	mapCreaturesCatalogResponseDto
} from './mappers/creatures.mapper';

@Injectable({ providedIn: 'root' })
export class HttpCreaturesRepository implements CreaturesRepository {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadCatalog(): Observable<CreaturesCatalog> {
		return this.http
			.get<CreaturesCatalogResponseDto>(`${this.baseUrl}/admin/creatures`, {
				withCredentials: true
			})
			.pipe(map(mapCreaturesCatalogResponseDto), catchError(handleApiError));
	}

	createCreature(command: CreateCreatureDto): Observable<Creature> {
		return this.http
			.post<CreatureDto>(`${this.baseUrl}/admin/creatures`, command, {
				withCredentials: true
			})
			.pipe(map(mapCreatureDto), catchError(handleApiError));
	}

	updateCreature(id: string, command: UpdateCreatureDto): Observable<Creature> {
		return this.http
			.patch<CreatureDto>(`${this.baseUrl}/admin/creatures/${id}`, command, {
				withCredentials: true
			})
			.pipe(map(mapCreatureDto), catchError(handleApiError));
	}

	deleteCreature(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/creatures/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}
}
