import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import {
	Attribute,
	AttributesAdminCatalog,
	Characteristic
} from '../domain/attributes.models';
import {
	CreateAttributeCommand,
	CreateCharacteristicCommand,
	UpdateAttributeActiveCommand,
	UpdateAttributeCommand,
	UpdateCharacteristicActiveCommand,
	UpdateCharacteristicCommand
} from '../state/attributes.commands';
import {
	AttributeDto,
	AttributesAdminCatalogDto,
	CharacteristicDto
} from './dto/attributes.dto';
import {
	mapAttributeDto,
	mapAttributesAdminCatalogDto,
	mapCharacteristicDto
} from './mappers/attributes.mapper';
import { AttributesRepository } from './attributes-repository.port';

@Injectable({ providedIn: 'root' })
export class HttpAttributesRepository implements AttributesRepository {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadAdminCatalog(): Observable<AttributesAdminCatalog> {
		return this.http
			.get<AttributesAdminCatalogDto>(`${this.baseUrl}/attributes/catalog`, {
				withCredentials: true
			})
			.pipe(
				map(mapAttributesAdminCatalogDto),
				catchError(handleApiError)
			);
	}

	createAttribute(command: CreateAttributeCommand): Observable<Attribute> {
		return this.http
			.post<AttributeDto>(`${this.baseUrl}/admin/attributes`, command, {
				withCredentials: true
			})
			.pipe(
				map(mapAttributeDto),
				catchError(handleApiError)
			);
	}

	updateAttribute(command: UpdateAttributeCommand): Observable<Attribute> {
		const { id, ...payload } = command;

		return this.http
			.patch<AttributeDto>(`${this.baseUrl}/admin/attributes/${id}`, payload, {
				withCredentials: true
			})
			.pipe(
				map(mapAttributeDto),
				catchError(handleApiError)
			);
	}

	updateAttributeActive(
		command: UpdateAttributeActiveCommand
	): Observable<Attribute> {
		return this.http
			.patch<AttributeDto>(
				`${this.baseUrl}/admin/attributes/${command.id}/active`,
				{ isActive: command.isActive },
				{ withCredentials: true }
			)
			.pipe(
				map(mapAttributeDto),
				catchError(handleApiError)
			);
	}

	deleteAttribute(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/attributes/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}

	createCharacteristic(
		command: CreateCharacteristicCommand
	): Observable<Characteristic> {
		return this.http
			.post<CharacteristicDto>(
				`${this.baseUrl}/admin/attributes/characteristics`,
				command,
				{ withCredentials: true }
			)
			.pipe(
				map(mapCharacteristicDto),
				catchError(handleApiError)
			);
	}

	updateCharacteristic(
		command: UpdateCharacteristicCommand
	): Observable<Characteristic> {
		const { id, ...payload } = command;

		return this.http
			.patch<CharacteristicDto>(
				`${this.baseUrl}/admin/attributes/characteristics/${id}`,
				payload,
				{ withCredentials: true }
			)
			.pipe(
				map(mapCharacteristicDto),
				catchError(handleApiError)
			);
	}

	updateCharacteristicActive(
		command: UpdateCharacteristicActiveCommand
	): Observable<Characteristic> {
		return this.http
			.patch<CharacteristicDto>(
				`${this.baseUrl}/admin/attributes/characteristics/${command.id}/active`,
				{ isActive: command.isActive },
				{ withCredentials: true }
			)
			.pipe(
				map(mapCharacteristicDto),
				catchError(handleApiError)
			);
	}

	deleteCharacteristic(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/attributes/characteristics/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}
}
