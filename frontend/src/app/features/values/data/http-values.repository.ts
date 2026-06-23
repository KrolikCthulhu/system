import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import { SystemValue, SystemValuesCatalog } from '../domain/values.models';
import { ValueGraphState } from '../ui/value-graph.models';
import {
	SystemValuesCatalogDto,
	CreateManualSystemValueDto,
	SystemValueDto,
	UpdateSystemValueCalculationDto,
	UpdateSystemValueDto
} from './dto/values.dto';
import { mapSystemValueDto, mapSystemValuesCatalogDto } from './mappers/values.mapper';
import { ValuesRepository } from './values-repository.port';

@Injectable({ providedIn: 'root' })
export class HttpValuesRepository implements ValuesRepository {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadCatalog(): Observable<SystemValuesCatalog> {
		return this.http
			.get<SystemValuesCatalogDto>(`${this.baseUrl}/values/catalog`, {
				withCredentials: true
			})
			.pipe(
				map(mapSystemValuesCatalogDto),
				catchError(handleApiError)
			);
	}

	createManual(command: {
		name: string;
		description?: string;
		displaySection?: string;
	}): Observable<SystemValue> {
		const payload: CreateManualSystemValueDto = {
			name: command.name,
			description: command.description,
			displaySection: command.displaySection
		};

		return this.http
			.post<SystemValueDto>(`${this.baseUrl}/admin/values`, payload, {
				withCredentials: true
			})
			.pipe(
				map(mapSystemValueDto),
				catchError(handleApiError)
			);
	}

	updateValue(
		id: string,
		command: {
			name?: string;
			description?: string;
			displaySection?: string;
		}
	): Observable<SystemValue> {
		const payload: UpdateSystemValueDto = {
			name: command.name,
			description: command.description,
			displaySection: command.displaySection
		};

		return this.http
			.patch<SystemValueDto>(`${this.baseUrl}/admin/values/${id}`, payload, {
				withCredentials: true
			})
			.pipe(
				map(mapSystemValueDto),
				catchError(handleApiError)
			);
	}

	updateCalculation(
		id: string,
		calculationGraph: ValueGraphState | null
	): Observable<void> {
		const payload: UpdateSystemValueCalculationDto = {
			calculationGraph
		};

		return this.http
			.patch<void>(
				`${this.baseUrl}/admin/values/${id}/calculation`,
				payload,
				{ withCredentials: true }
			)
			.pipe(catchError(handleApiError));
	}

	deleteValue(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/values/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}
}
