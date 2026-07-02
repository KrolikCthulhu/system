import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import {
	ArmorPreset,
	ArmorPresetsCatalog
} from '../domain/armor-presets.models';
import { ArmorPresetsRepository } from './armor-presets-repository.port';
import {
	ArmorPresetDto,
	ArmorPresetsCatalogResponseDto,
	CreateArmorPresetDto,
	UpdateArmorPresetDto
} from './dto/armor-presets.dto';
import {
	mapArmorPresetDto,
	mapArmorPresetsCatalogResponseDto
} from './mappers/armor-presets.mapper';

@Injectable({ providedIn: 'root' })
export class HttpArmorPresetsRepository implements ArmorPresetsRepository {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadCatalog(): Observable<ArmorPresetsCatalog> {
		return this.http
			.get<ArmorPresetsCatalogResponseDto>(
				`${this.baseUrl}/admin/armor-presets`,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapArmorPresetsCatalogResponseDto), catchError(handleApiError));
	}

	createArmorPreset(command: CreateArmorPresetDto): Observable<ArmorPreset> {
		return this.http
			.post<ArmorPresetDto>(`${this.baseUrl}/admin/armor-presets`, command, {
				withCredentials: true
			})
			.pipe(map(mapArmorPresetDto), catchError(handleApiError));
	}

	updateArmorPreset(
		id: string,
		command: UpdateArmorPresetDto
	): Observable<ArmorPreset> {
		return this.http
			.patch<ArmorPresetDto>(
				`${this.baseUrl}/admin/armor-presets/${id}`,
				command,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapArmorPresetDto), catchError(handleApiError));
	}

	deleteArmorPreset(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/armor-presets/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}
}
