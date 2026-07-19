import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Condition, ConditionsCatalog } from '../domain/conditions.models';
import {
	ConditionDurationType,
	ConditionEffect,
	ConditionRepeatDurationMode,
	ConditionRepeatLevelMode,
	ConditionRemovalMethod,
	ConditionTextBlock
} from '../domain/condition-rules.models';

export interface ConditionsRepository {
	loadCatalog(): Observable<ConditionsCatalog>;
	createCondition(command: {
		name: string;
		description?: string;
		durationType?: ConditionDurationType;
		repeatLevelMode?: ConditionRepeatLevelMode;
		repeatDurationMode?: ConditionRepeatDurationMode;
		maxLevel?: number;
		removalMethods?: ConditionRemovalMethod[];
		effects?: ConditionEffect[];
		textBlocks?: ConditionTextBlock[];
		isActive?: boolean;
		sortOrder?: number;
	}): Observable<Condition>;
	updateCondition(
		id: string,
		command: {
			name?: string;
			description?: string;
			durationType?: ConditionDurationType;
			repeatLevelMode?: ConditionRepeatLevelMode;
			repeatDurationMode?: ConditionRepeatDurationMode;
			maxLevel?: number;
			removalMethods?: ConditionRemovalMethod[];
			effects?: ConditionEffect[];
			textBlocks?: ConditionTextBlock[];
			isActive?: boolean;
			sortOrder?: number;
		}
	): Observable<Condition>;
	deleteCondition(id: string): Observable<void>;
}

export const CONDITIONS_REPOSITORY = new InjectionToken<ConditionsRepository>(
	'CONDITIONS_REPOSITORY'
);
