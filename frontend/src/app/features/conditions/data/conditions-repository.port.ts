import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
	Condition,
	ConditionsCatalog
} from '../domain/conditions.models';

export interface ConditionsRepository {
	loadCatalog(): Observable<ConditionsCatalog>;
	createCondition(command: {
		name: string;
		description?: string;
		isActive?: boolean;
		sortOrder?: number;
	}): Observable<Condition>;
	updateCondition(
		id: string,
		command: {
			name?: string;
			description?: string;
			isActive?: boolean;
			sortOrder?: number;
		}
	): Observable<Condition>;
	deleteCondition(id: string): Observable<void>;
}

export const CONDITIONS_REPOSITORY =
	new InjectionToken<ConditionsRepository>('CONDITIONS_REPOSITORY');
