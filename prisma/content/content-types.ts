import {
	AreaShapeKind,
	MagicWordType,
	Prisma,
	SpellStatus
} from '../__generated__/index.js';

export type ContentDocument<TCollections extends Record<string, unknown>> = {
	schemaVersion: 1;
} & TCollections;

export type GroupedContentDocument<TCollections extends Record<string, unknown>> =
	ContentDocument<TCollections> & {
		group: string;
	};

export type SlugRef = {
	slug: string;
	name: string;
};

export type MagicWordRef = SlugRef & {
	type: keyof typeof MagicWordType;
};

export type SortableContentItem = SlugRef & {
	sortOrder: number;
};

export type NamedContentItem = SortableContentItem & {
	description?: string;
};

export type DamageTypeContent = SortableContentItem;

export type ConditionContent = SortableContentItem;

export type ProgressionContent = NamedContentItem & {
	kind: string;
	config: Prisma.InputJsonValue;
};

export type SkillCategoryContent = NamedContentItem & {
	skills: SkillContent[];
};

export type SkillContent = SortableContentItem & {
	rollCharacteristicName: string;
	rollConsequenceName: string;
};

export type MagicWordContent = SortableContentItem & {
	type: keyof typeof MagicWordType;
};

export type MagicModifierGestureRestrictionContent = {
	modifierName: string;
	modifierSlug: string;
	gestureNames: string[];
	gestureSlugs: string[];
};

export type MagicWordEssenceProfileContent = SlugRef & {
	damageAffinity: number;
	rangeAffinity: number;
	controlAffinity: number;
	durationAffinity: number;
	areaAffinity: number;
	stabilityAffinity: number;
};

export type MagicWordLinkContent = {
	magicWordName: string;
	magicWordSlug: string;
	skillNames: string[];
	skillSlugs: string[];
	damageTypeNames: string[];
	damageTypeSlugs: string[];
	conditionNames: string[];
	conditionSlugs: string[];
};

export type AreaShapeContent = SlugRef & {
	gestureSlug: string;
	kind: keyof typeof AreaShapeKind;
	description?: string;
	dimensions: Prisma.InputJsonValue;
	influenceConfig: Prisma.InputJsonValue;
	sortOrder: number;
	isActive?: boolean;
};

export type SpellMechanicCategoryContent = SortableContentItem;

export type SpellMechanicContent = SlugRef & {
	categoryName: string;
	description?: string;
	sortOrder: number;
	configSchema: Prisma.InputJsonValue;
	parameters: SpellMechanicParameterContent[];
	actions: SpellMechanicActionContent[];
	textTemplate:
		| string
		| {
				segments: Array<Record<string, unknown>>;
		  };
};

export type SpellMechanicParameterContent = SlugRef & {
	kind:
		| 'target'
		| 'skill'
		| 'number'
		| 'formula'
		| 'damageType'
		| 'condition'
		| 'systemValue'
		| 'text';
	numericRole?: 'damage' | 'range' | 'duration' | 'area' | 'targetCount' | 'custom';
	required: boolean;
	configuredBySpell: boolean;
	overrideAllowed: boolean;
	defaultValue: {
		mode: 'empty' | 'static' | 'fromMagicWord';
		value: string;
	};
	defaultTargetConfig?: Prisma.InputJsonValue;
};

export type SpellMechanicActionContent = {
	slug: string;
	name: string;
	kind:
		| 'roll'
		| 'check'
		| 'comparison'
		| 'calculation'
		| 'branch'
		| 'effectScale'
		| 'valueChange'
		| 'conditionAdd'
		| 'conditionRemove'
		| 'text'
		| 'custom';
	config: Prisma.InputJsonValue;
	isActive?: boolean;
	sortOrder?: number;
};

export type SpellContent = {
	name: string;
	formulaName?: string;
	description?: string;
	status: keyof typeof SpellStatus;
	sortOrder?: number;
	formula: {
		action: MagicWordRef;
		essence: MagicWordRef;
		gesture: MagicWordRef;
	};
	targetConfigs: Prisma.InputJsonValue[];
	mechanicBlocks: SpellMechanicBlockContent[];
	textBlocks: SpellTextBlockContent[];
};

export type SpellMechanicBlockContent = {
	mechanicRef: SlugRef;
	parameters: Record<string, unknown>;
	config?: Prisma.InputJsonValue;
	isActive?: boolean;
	sortOrder?: number;
};

export type SpellTextBlockContent =
	| {
			kind: 'text';
			text: string;
			isActive?: boolean;
			sortOrder?: number;
	  }
	| {
			kind: 'mechanicText';
			mechanic: string;
			text?: string;
			isActive?: boolean;
			sortOrder?: number;
	  };
