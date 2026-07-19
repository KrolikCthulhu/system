import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import {
	AnatomyScheme,
	AnatomySchemesCatalog
} from '../domain/anatomy-schemes.models';
import { AnatomySchemesRepository } from './anatomy-schemes-repository.port';
import {
	AnatomySchemesCatalogResponseDto,
	CreateAnatomySchemeDto,
	UpdateAnatomySchemeDto
} from './dto/anatomy-schemes.dto';
import {
	mapAnatomySchemeDto,
	mapAnatomySchemesCatalogResponseDto
} from './mappers/anatomy-schemes.mapper';

@Injectable()
export class HttpAnatomySchemesRepository implements AnatomySchemesRepository {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadCatalog(): Observable<AnatomySchemesCatalog> {
		return this.http
			.get<AnatomySchemesCatalogResponseDto>(
				`${this.baseUrl}/admin/anatomy-schemes`,
				{
					withCredentials: true
				}
			)
			.pipe(
				map(mapAnatomySchemesCatalogResponseDto),
				catchError(handleApiError)
			);
	}

	createScheme(command: CreateAnatomySchemeDto): Observable<AnatomyScheme> {
		return this.http
			.post<AnatomyScheme>(`${this.baseUrl}/admin/anatomy-schemes`, command, {
				withCredentials: true
			})
			.pipe(map(mapAnatomySchemeDto), catchError(handleApiError));
	}

	updateScheme(
		id: string,
		command: UpdateAnatomySchemeDto
	): Observable<AnatomyScheme> {
		return this.http
			.patch<AnatomyScheme>(
				`${this.baseUrl}/admin/anatomy-schemes/${id}`,
				command,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapAnatomySchemeDto), catchError(handleApiError));
	}

	deleteScheme(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/anatomy-schemes/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}
}
