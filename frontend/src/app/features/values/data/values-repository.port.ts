import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { SystemValuesCatalog } from '../domain/values.models';
import { ValueGraphState } from '../ui/value-graph.models';

export interface ValuesRepository {
	loadCatalog(): Observable<SystemValuesCatalog>;
	updateCalculation(
		sourceType: 'skill' | 'attribute' | 'characteristic',
		id: string,
		baseSourceType: 'character-input' | 'computed',
		calculationGraph: ValueGraphState | null
	): Observable<void>;
}

export const VALUES_REPOSITORY = new InjectionToken<ValuesRepository>(
	'VALUES_REPOSITORY'
);
