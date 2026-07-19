import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
	CombatIntent,
	CombatIntentTextBlock,
	CombatIntentsCatalog
} from '../domain/combat-intents.models';

export interface CombatIntentsRepository {
	loadCatalog(): Observable<CombatIntentsCatalog>;
	createCombatIntent(command: {
		name: string;
		category: string;
		textBlocks?: CombatIntentTextBlock[];
		isActive?: boolean;
		sortOrder?: number;
	}): Observable<CombatIntent>;
	updateCombatIntent(
		id: string,
		command: {
			name?: string;
			category?: string;
			textBlocks?: CombatIntentTextBlock[];
			isActive?: boolean;
			sortOrder?: number;
		}
	): Observable<CombatIntent>;
	deleteCombatIntent(id: string): Observable<void>;
}

export const COMBAT_INTENTS_REPOSITORY =
	new InjectionToken<CombatIntentsRepository>('COMBAT_INTENTS_REPOSITORY');
