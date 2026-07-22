import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import {
	NaturalAttack,
	NaturalAttacksCatalog,
	Weapon,
	WeaponTemplate,
	WeaponsCatalog
} from '../domain/weapons.models';
import {
	CreateNaturalAttackDto,
	CreateWeaponDto,
	CreateWeaponTemplateDto,
	NaturalAttackDto,
	NaturalAttacksCatalogResponseDto,
	UpdateNaturalAttackDto,
	UpdateWeaponDto,
	UpdateWeaponTemplateDto,
	WeaponDto,
	WeaponTemplateDto,
	WeaponsCatalogResponseDto
} from './dto/weapons.dto';
import { WeaponsRepository } from './weapons-repository.port';
import {
	mapNaturalAttackDto,
	mapNaturalAttacksCatalogResponseDto,
	mapWeaponDto,
	mapWeaponTemplateDto,
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

	createWeaponTemplate(
		command: CreateWeaponTemplateDto
	): Observable<WeaponTemplate> {
		return this.http
			.post<WeaponTemplateDto>(
				`${this.baseUrl}/admin/weapon-templates`,
				command,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapWeaponTemplateDto), catchError(handleApiError));
	}

	updateWeaponTemplate(
		id: string,
		command: UpdateWeaponTemplateDto
	): Observable<WeaponTemplate> {
		return this.http
			.patch<WeaponTemplateDto>(
				`${this.baseUrl}/admin/weapon-templates/${id}`,
				command,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapWeaponTemplateDto), catchError(handleApiError));
	}

	deleteWeaponTemplate(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/weapon-templates/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}

	loadNaturalAttacksCatalog(): Observable<NaturalAttacksCatalog> {
		return this.http
			.get<NaturalAttacksCatalogResponseDto>(
				`${this.baseUrl}/admin/natural-attacks`,
				{
					withCredentials: true
				}
			)
			.pipe(
				map(mapNaturalAttacksCatalogResponseDto),
				catchError(handleApiError)
			);
	}

	createNaturalAttack(
		command: CreateNaturalAttackDto
	): Observable<NaturalAttack> {
		return this.http
			.post<NaturalAttackDto>(
				`${this.baseUrl}/admin/natural-attacks`,
				command,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapNaturalAttackDto), catchError(handleApiError));
	}

	updateNaturalAttack(
		id: string,
		command: UpdateNaturalAttackDto
	): Observable<NaturalAttack> {
		return this.http
			.patch<NaturalAttackDto>(
				`${this.baseUrl}/admin/natural-attacks/${id}`,
				command,
				{
					withCredentials: true
				}
			)
			.pipe(map(mapNaturalAttackDto), catchError(handleApiError));
	}

	deleteNaturalAttack(id: string): Observable<void> {
		return this.http
			.delete<void>(`${this.baseUrl}/admin/natural-attacks/${id}`, {
				withCredentials: true
			})
			.pipe(catchError(handleApiError));
	}
}
