import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
	DamageType,
	DamageTypesCatalog
} from '../domain/damage-types.models';

export interface DamageTypesRepository {
	loadCatalog(): Observable<DamageTypesCatalog>;
	createDamageType(command: {
		name: string;
		description?: string;
		isActive?: boolean;
		sortOrder?: number;
	}): Observable<DamageType>;
	updateDamageType(
		id: string,
		command: {
			name?: string;
			description?: string;
			isActive?: boolean;
			sortOrder?: number;
		}
	): Observable<DamageType>;
	deleteDamageType(id: string): Observable<void>;
}

export const DAMAGE_TYPES_REPOSITORY =
	new InjectionToken<DamageTypesRepository>('DAMAGE_TYPES_REPOSITORY');
