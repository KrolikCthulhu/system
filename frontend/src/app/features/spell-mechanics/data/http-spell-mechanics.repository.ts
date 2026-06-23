import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import {
	SpellMechanic,
	SpellMechanicCategory,
	SpellMechanicsCatalog
} from '../domain/spell-mechanics.models';
import {
	CreateSpellMechanicCategoryDto,
	CreateSpellMechanicDto,
	SpellMechanicCategoryDto,
	SpellMechanicDto,
	SpellMechanicsCatalogResponseDto,
	UpdateSpellMechanicCategoryDto,
	UpdateSpellMechanicDto
} from './dto/spell-mechanics.dto';
import {
	mapSpellMechanicCategoryDto,
	mapSpellMechanicDto,
	mapSpellMechanicsCatalogResponseDto
} from './mappers/spell-mechanics.mapper';
import { SpellMechanicsRepository } from './spell-mechanics-repository.port';

@Injectable({ providedIn: 'root' })
export class HttpSpellMechanicsRepository
	implements SpellMechanicsRepository
{
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadCatalog(): Observable<SpellMechanicsCatalog> {
		return this.http
			.get<SpellMechanicsCatalogResponseDto>(
				`${this.baseUrl}/admin/spell-mechanics/catalog`,
				{ withCredentials: true }
			)
			.pipe(
				map(mapSpellMechanicsCatalogResponseDto),
				catchError(handleApiError)
			);
	}

	createCategory(
		command: CreateSpellMechanicCategoryDto
	): Observable<SpellMechanicCategory> {
		return this.http
			.post<SpellMechanicCategoryDto>(
				`${this.baseUrl}/admin/spell-mechanics/categories`,
				command,
				{ withCredentials: true }
			)
			.pipe(
				map(mapSpellMechanicCategoryDto),
				catchError(handleApiError)
			);
	}

	updateCategory(
		id: string,
		command: UpdateSpellMechanicCategoryDto
	): Observable<SpellMechanicCategory> {
		return this.http
			.patch<SpellMechanicCategoryDto>(
				`${this.baseUrl}/admin/spell-mechanics/categories/${id}`,
				command,
				{ withCredentials: true }
			)
			.pipe(
				map(mapSpellMechanicCategoryDto),
				catchError(handleApiError)
			);
	}

	deleteCategory(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/spell-mechanics/categories/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}

	createMechanic(command: CreateSpellMechanicDto): Observable<SpellMechanic> {
		return this.http
			.post<SpellMechanicDto>(
				`${this.baseUrl}/admin/spell-mechanics`,
				command,
				{ withCredentials: true }
			)
			.pipe(
				map(mapSpellMechanicDto),
				catchError(handleApiError)
			);
	}

	updateMechanic(
		id: string,
		command: UpdateSpellMechanicDto
	): Observable<SpellMechanic> {
		return this.http
			.patch<SpellMechanicDto>(
				`${this.baseUrl}/admin/spell-mechanics/${id}`,
				command,
				{ withCredentials: true }
			)
			.pipe(
				map(mapSpellMechanicDto),
				catchError(handleApiError)
			);
	}

	deleteMechanic(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/spell-mechanics/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}
}
