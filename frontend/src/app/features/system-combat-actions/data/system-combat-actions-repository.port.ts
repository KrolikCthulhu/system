import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
	SystemCombatAction,
	SystemCombatActionsCatalog
} from '../domain/system-combat-actions.models';

export interface SystemCombatActionsRepository {
	loadCatalog(): Observable<SystemCombatActionsCatalog>;
	updateAction(
		id: string,
		command: {
			label?: string;
			description?: string;
			targetChoiceLabel?: string;
			confirmationTitle?: string;
		}
	): Observable<SystemCombatAction>;
}

export const SYSTEM_COMBAT_ACTIONS_REPOSITORY =
	new InjectionToken<SystemCombatActionsRepository>(
		'SYSTEM_COMBAT_ACTIONS_REPOSITORY'
	);
