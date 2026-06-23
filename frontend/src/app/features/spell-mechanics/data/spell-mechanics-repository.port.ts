import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
	SpellMechanic,
	SpellMechanicActionCommand,
	SpellMechanicCategory,
	SpellMechanicParameterCommand,
	SpellMechanicsCatalog
} from '../domain/spell-mechanics.models';

export interface SpellMechanicsRepository {
	loadCatalog(): Observable<SpellMechanicsCatalog>;
	createCategory(command: {
		name: string;
		description?: string;
		isActive?: boolean;
		sortOrder?: number;
	}): Observable<SpellMechanicCategory>;
	updateCategory(
		id: string,
		command: {
			name?: string;
			description?: string;
			isActive?: boolean;
			sortOrder?: number;
		}
	): Observable<SpellMechanicCategory>;
	deleteCategory(id: string): Observable<void>;
	createMechanic(command: {
		categoryId: string;
		name: string;
		description?: string;
		configSchema?: Record<string, unknown>;
		textTemplate?: string;
		isActive?: boolean;
		sortOrder?: number;
		parameters?: SpellMechanicParameterCommand[];
		actions?: SpellMechanicActionCommand[];
	}): Observable<SpellMechanic>;
	updateMechanic(
		id: string,
		command: {
			categoryId?: string;
			name?: string;
			description?: string;
			configSchema?: Record<string, unknown>;
			textTemplate?: string;
			isActive?: boolean;
			sortOrder?: number;
			parameters?: SpellMechanicParameterCommand[];
			actions?: SpellMechanicActionCommand[];
		}
	): Observable<SpellMechanic>;
	deleteMechanic(id: string): Observable<void>;
}

export const SPELL_MECHANICS_REPOSITORY =
	new InjectionToken<SpellMechanicsRepository>('SPELL_MECHANICS_REPOSITORY');
