import {
	ConditionDurationType,
	ConditionEffectScope,
	ConditionEffectType,
	ConditionRepeatDurationMode,
	ConditionRepeatLevelMode,
	ConditionRemovalMethod,
	ConditionTextBlock,
	ConditionTextToken
} from '../../domain/condition-rules.models';

export interface ConditionEffectDto {
	type: ConditionEffectType;
	scope: ConditionEffectScope;
	value?: number;
	config?: Record<string, unknown>;
	sortOrder?: number;
}

export interface ConditionDto {
	id: string;
	slug: string;
	name: string;
	description: string;
	durationType: ConditionDurationType;
	repeatLevelMode: ConditionRepeatLevelMode;
	repeatDurationMode: ConditionRepeatDurationMode;
	maxLevel: number;
	removalMethods: ConditionRemovalMethod[];
	effects: ConditionEffectDto[];
	textBlocks: ConditionTextBlockDto[];
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export type ConditionTextBlockDto =
	| {
			kind: 'text';
			text: string;
			isActive?: boolean;
			sortOrder?: number;
	  }
	| {
			kind: 'token';
			token: ConditionTextToken;
			isActive?: boolean;
			sortOrder?: number;
	  };

export interface ConditionsCatalogResponseDto {
	conditions: ConditionDto[];
}

export interface CreateConditionDto {
	name: string;
	description?: string;
	durationType?: ConditionDurationType;
	repeatLevelMode?: ConditionRepeatLevelMode;
	repeatDurationMode?: ConditionRepeatDurationMode;
	maxLevel?: number;
	removalMethods?: ConditionRemovalMethod[];
	effects?: ConditionEffectDto[];
	textBlocks?: ConditionTextBlock[];
	isActive?: boolean;
	sortOrder?: number;
}

export interface UpdateConditionDto {
	name?: string;
	description?: string;
	durationType?: ConditionDurationType;
	repeatLevelMode?: ConditionRepeatLevelMode;
	repeatDurationMode?: ConditionRepeatDurationMode;
	maxLevel?: number;
	removalMethods?: ConditionRemovalMethod[];
	effects?: ConditionEffectDto[];
	textBlocks?: ConditionTextBlock[];
	isActive?: boolean;
	sortOrder?: number;
}
