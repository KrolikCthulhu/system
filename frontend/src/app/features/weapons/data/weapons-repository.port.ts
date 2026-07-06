import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Weapon, WeaponsCatalog } from '../domain/weapons.models';

export interface WeaponsRepository {
	loadCatalog(): Observable<WeaponsCatalog>;
	createWeapon(command: {
		name: string;
		skillId: string;
		extraDamage: number;
		isActive?: boolean;
		sortOrder?: number;
	}): Observable<Weapon>;
	updateWeapon(
		id: string,
		command: {
			name?: string;
			skillId?: string;
			extraDamage?: number;
			isActive?: boolean;
			sortOrder?: number;
		}
	): Observable<Weapon>;
	deleteWeapon(id: string): Observable<void>;
}

export const WEAPONS_REPOSITORY =
	new InjectionToken<WeaponsRepository>('WEAPONS_REPOSITORY');
