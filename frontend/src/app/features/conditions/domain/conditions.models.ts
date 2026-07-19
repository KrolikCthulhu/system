import {
	ConditionDurationType,
	ConditionEffect,
	ConditionRepeatDurationMode,
	ConditionRepeatLevelMode,
	ConditionRemovalMethod,
	ConditionTextBlock
} from './condition-rules.models';

export interface Condition {
	id: string;
	slug: string;
	name: string;
	description: string;
	durationType: ConditionDurationType;
	repeatLevelMode: ConditionRepeatLevelMode;
	repeatDurationMode: ConditionRepeatDurationMode;
	maxLevel: number;
	removalMethods: ConditionRemovalMethod[];
	effects: ConditionEffect[];
	textBlocks: ConditionTextBlock[];
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface ConditionsCatalog {
	conditions: Condition[];
}
