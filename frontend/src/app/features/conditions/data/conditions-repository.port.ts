import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Condition, ConditionsCatalog } from '../domain/conditions.models';
import {
	ConditionDurationType,
	ConditionEffect,
	ConditionApplicationCondition,
	ConditionDuplicateInstanceMode,
	ConditionInstanceLimitMode,
	ConditionInstanceMode,
	ConditionInstanceOverflowMode,
	ConditionInstanceUniquenessMode,
	ConditionParameter,
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
		instanceMode?: ConditionInstanceMode;
		instanceLimitMode?: ConditionInstanceLimitMode;
		maxInstances?: number;
		instanceOverflowMode?: ConditionInstanceOverflowMode;
		instanceUniquenessMode?: ConditionInstanceUniquenessMode;
		duplicateInstanceMode?: ConditionDuplicateInstanceMode;
		maxLevel?: number;
		removalMethods?: ConditionRemovalMethod[];
		effects?: ConditionEffect[];
		applicationConditions?: ConditionApplicationCondition[];
		parameters?: ConditionParameter[];
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
			instanceMode?: ConditionInstanceMode;
			instanceLimitMode?: ConditionInstanceLimitMode;
			maxInstances?: number;
			instanceOverflowMode?: ConditionInstanceOverflowMode;
			instanceUniquenessMode?: ConditionInstanceUniquenessMode;
			duplicateInstanceMode?: ConditionDuplicateInstanceMode;
			maxLevel?: number;
			removalMethods?: ConditionRemovalMethod[];
			effects?: ConditionEffect[];
			applicationConditions?: ConditionApplicationCondition[];
			parameters?: ConditionParameter[];
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
