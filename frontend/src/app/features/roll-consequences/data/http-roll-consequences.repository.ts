import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { RollConsequence, RollConsequencesCatalog } from '../domain/roll-consequences.models';
import {
	CreateRollConsequenceCommand,
	UpdateRollConsequenceActiveCommand,
	UpdateRollConsequenceCommand
} from '../state/roll-consequences.commands';
import {
	RollConsequenceDto,
	RollConsequencesCatalogDto
} from './dto/roll-consequences.dto';
import {
	mapRollConsequenceDto,
	mapRollConsequencesCatalogDto
} from './mappers/roll-consequences.mapper';
import { RollConsequencesRepository } from './roll-consequences-repository.port';

@Injectable({ providedIn: 'root' })
export class HttpRollConsequencesRepository
	implements RollConsequencesRepository
{
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadCatalog(): Observable<RollConsequencesCatalog> {
		return this.http
			.get<RollConsequencesCatalogDto>(
				`${this.baseUrl}/admin/roll-consequences`,
				{ withCredentials: true }
			)
			.pipe(
				map(mapRollConsequencesCatalogDto),
				catchError(error => this.handleHttpError(error))
			);
	}

	loadOptions(): Observable<RollConsequence[]> {
		return this.http
			.get<RollConsequenceDto[]>(
				`${this.baseUrl}/admin/roll-consequences/options`,
				{ withCredentials: true }
			)
			.pipe(
				map(items => items.map(mapRollConsequenceDto)),
				catchError(error => this.handleHttpError(error))
			);
	}

	load(id: string): Observable<RollConsequence> {
		return this.http
			.get<RollConsequenceDto>(
				`${this.baseUrl}/admin/roll-consequences/${id}`,
				{ withCredentials: true }
			)
			.pipe(
				map(mapRollConsequenceDto),
				catchError(error => this.handleHttpError(error))
			);
	}

	create(command: CreateRollConsequenceCommand): Observable<RollConsequence> {
		return this.http
			.post<RollConsequenceDto>(
				`${this.baseUrl}/admin/roll-consequences`,
				command,
				{ withCredentials: true }
			)
			.pipe(
				map(mapRollConsequenceDto),
				catchError(error => this.handleHttpError(error))
			);
	}

	update(command: UpdateRollConsequenceCommand): Observable<RollConsequence> {
		const { id, ...payload } = command;

		return this.http
			.patch<RollConsequenceDto>(
				`${this.baseUrl}/admin/roll-consequences/${id}`,
				payload,
				{ withCredentials: true }
			)
			.pipe(
				map(mapRollConsequenceDto),
				catchError(error => this.handleHttpError(error))
			);
	}

	updateActive(
		command: UpdateRollConsequenceActiveCommand
	): Observable<RollConsequence> {
		return this.http
			.patch<RollConsequenceDto>(
				`${this.baseUrl}/admin/roll-consequences/${command.id}/active`,
				{ isActive: command.isActive },
				{ withCredentials: true }
			)
			.pipe(
				map(mapRollConsequenceDto),
				catchError(error => this.handleHttpError(error))
			);
	}

	delete(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/roll-consequences/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(error => this.handleHttpError(error)));
	}

	private handleHttpError(error: unknown) {
		return throwError(() => new Error(extractApiErrorMessage(error)));
	}
}

function extractApiErrorMessage(error: unknown): string {
	if (error instanceof HttpErrorResponse) {
		const message = error.error?.message;

		if (Array.isArray(message)) {
			return message.join('\n');
		}

		if (typeof message === 'string' && message.trim()) {
			return message;
		}

		if (error.status === 0) {
			return 'API is unavailable.';
		}
	}

	return 'Request failed.';
}
