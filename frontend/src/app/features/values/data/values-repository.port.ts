import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { SystemValue, SystemValuesCatalog } from '../domain/values.models';
import { ValueGraphState } from '../ui/value-graph.models';

export interface ValuesRepository {
	loadCatalog(): Observable<SystemValuesCatalog>;
	createManual(command: {
		name: string;
		description?: string;
	}): Observable<SystemValue>;
	updateValue(
		id: string,
		command: {
			name?: string;
			description?: string;
		}
	): Observable<SystemValue>;
	updateCalculation(
		id: string,
		calculationGraph: ValueGraphState | null
	): Observable<void>;
	deleteValue(id: string): Observable<void>;
}

export const VALUES_REPOSITORY = new InjectionToken<ValuesRepository>(
	'VALUES_REPOSITORY'
);
