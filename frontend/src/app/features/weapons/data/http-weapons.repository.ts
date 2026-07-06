import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import { Weapon, WeaponsCatalog } from '../domain/weapons.models';
import {
	CreateWeaponDto,
	UpdateWeaponDto,
	WeaponDto,
	WeaponsCatalogResponseDto
} from './dto/weapons.dto';
import { WeaponsRepository } from './weapons-repository.port';
import {
	mapWeaponDto,
	mapWeaponsCatalogResponseDto
} from './mappers/weapons.mapper';

@Injectable({ providedIn: 'root' })
export class HttpWeaponsRepository implements WeaponsRepository {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadCatalog(): Observable<WeaponsCatalog> {
		return this.http
			.get<WeaponsCatalogResponseDto>(`${this.baseUrl}/admin/weapons`, {
				withCredentials: true
			})
			.pipe(map(mapWeaponsCatalogResponseDto), catchError(handleApiError));
	}

	createWeapon(command: CreateWeaponDto): Observable<Weapon> {
		return this.http
			.post<WeaponDto>(`${this.baseUrl}/admin/weapons`, command, {
				withCredentials: true
			})
			.pipe(map(mapWeaponDto), catchError(handleApiError));
	}

	updateWeapon(id: string, command: UpdateWeaponDto): Observable<Weapon> {
		return this.http
			.patch<WeaponDto>(`${this.baseUrl}/admin/weapons/${id}`, command, {
				withCredentials: true
			})
			.pipe(map(mapWeaponDto), catchError(handleApiError));
	}

	deleteWeapon(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/weapons/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}
}
