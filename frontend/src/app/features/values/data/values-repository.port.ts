import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { SystemValuesCatalog } from '../domain/values.models';
import { ValueGraphState } from '../ui/value-graph.models';

export interface ValuesRepository {
	loadCatalog(): Observable<SystemValuesCatalog>;
	updateCalculation(
		id: string,
		calculationGraph: ValueGraphState | null
	): Observable<void>;
}

export const VALUES_REPOSITORY = new InjectionToken<ValuesRepository>(
	'VALUES_REPOSITORY'
);
