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
} from './condition-rules.models';

export interface Condition {
	id: string;
	slug: string;
	name: string;
	description: string;
	durationType: ConditionDurationType;
	repeatLevelMode: ConditionRepeatLevelMode;
	repeatDurationMode: ConditionRepeatDurationMode;
	instanceMode: ConditionInstanceMode;
	instanceLimitMode: ConditionInstanceLimitMode;
	maxInstances: number;
	instanceOverflowMode: ConditionInstanceOverflowMode;
	instanceUniquenessMode: ConditionInstanceUniquenessMode;
	duplicateInstanceMode: ConditionDuplicateInstanceMode;
	maxLevel: number;
	removalMethods: ConditionRemovalMethod[];
	effects: ConditionEffect[];
	applicationConditions: ConditionApplicationCondition[];
	parameters: ConditionParameter[];
	textBlocks: ConditionTextBlock[];
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface ConditionsCatalog {
	conditions: Condition[];
}
