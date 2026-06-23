import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import {
	ProgressionPreset,
	ProgressionPresetsCatalog
} from '../domain/progression-presets.models';
import {
	CreateProgressionPresetDto,
	ProgressionPresetDto,
	ProgressionPresetsCatalogResponseDto,
	UpdateProgressionPresetDto
} from './dto/progression-presets.dto';
import { ProgressionPresetsRepository } from './progression-presets-repository.port';
import {
	mapProgressionPresetDto,
	mapProgressionPresetsCatalogResponseDto
} from './mappers/progression-presets.mapper';

@Injectable({ providedIn: 'root' })
export class HttpProgressionPresetsRepository
	implements ProgressionPresetsRepository
{
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadCatalog(): Observable<ProgressionPresetsCatalog> {
		return this.http
			.get<ProgressionPresetsCatalogResponseDto>(
				`${this.baseUrl}/admin/progression-presets`,
				{ withCredentials: true }
			)
			.pipe(
				map(mapProgressionPresetsCatalogResponseDto),
				catchError(handleApiError)
			);
	}

	createPreset(command: CreateProgressionPresetDto): Observable<ProgressionPreset> {
		return this.http
			.post<ProgressionPresetDto>(
				`${this.baseUrl}/admin/progression-presets`,
				command,
				{ withCredentials: true }
			)
			.pipe(
				map(mapProgressionPresetDto),
				catchError(handleApiError)
			);
	}

	updatePreset(
		id: string,
		command: UpdateProgressionPresetDto
	): Observable<ProgressionPreset> {
		return this.http
			.patch<ProgressionPresetDto>(
				`${this.baseUrl}/admin/progression-presets/${id}`,
				command,
				{ withCredentials: true }
			)
			.pipe(
				map(mapProgressionPresetDto),
				catchError(handleApiError)
			);
	}

	deletePreset(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/progression-presets/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}
}
