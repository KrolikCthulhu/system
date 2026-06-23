export type MagicWordType = 'ACTION' | 'ESSENCE' | 'GESTURE' | 'MODIFIER';
export type AreaShapeKind =
	| 'POINT'
	| 'LINE'
	| 'PLANE'
	| 'CONE'
	| 'SPHERE'
	| 'CUBE'
	| 'CYLINDER'
	| 'RING';

export type AreaShapeInfluenceSourceKind =
	| 'systemValue'
	| 'linkedSkill'
	| 'essenceProfile';
export type AreaShapeOrientation = 'horizontal' | 'vertical' | 'free';

export interface AreaShapeInfluence {
	sourceKind: AreaShapeInfluenceSourceKind;
	sourceKey: string;
	targetDimension: string;
	weight: number;
}

export interface AreaShapeDimensions {
	version: 1;
	primaryDimension: string;
	unit: string;
	base: Record<string, number>;
	orientation?: AreaShapeOrientation;
	tileSize?: number;
}

export interface AreaShapeInfluenceConfig {
	version: 1;
	sources: AreaShapeInfluence[];
}

export interface MagicWordAreaShape {
	kind: AreaShapeKind;
	name: string;
	description: string;
	dimensions: AreaShapeDimensions;
	influenceConfig: AreaShapeInfluenceConfig;
	isActive: boolean;
	sortOrder: number;
}

export interface MagicWordGestureOption {
	id: string;
	slug: string;
	name: string;
}

export interface MagicWordSkillOption {
	id: string;
	slug: string;
	name: string;
	categoryName: string;
}

export interface MagicWordLinkedOption {
	id: string;
	slug: string;
	name: string;
}

export interface MagicWordEssenceProfile {
	damageAffinity: number;
	rangeAffinity: number;
	controlAffinity: number;
	durationAffinity: number;
	areaAffinity: number;
	stabilityAffinity: number;
}

export interface MagicWord {
	id: string;
	type: MagicWordType;
	slug: string;
	name: string;
	description: string;
	isActive: boolean;
	sortOrder: number;
	allowedGestureIds: string[];
	allowedGestures: MagicWordGestureOption[];
	skillIds: string[];
	skills: MagicWordSkillOption[];
	damageTypeIds: string[];
	damageTypes: MagicWordLinkedOption[];
	conditionIds: string[];
	conditions: MagicWordLinkedOption[];
	essenceProfile: MagicWordEssenceProfile | null;
	areaShape: MagicWordAreaShape | null;
	createdAt: string;
	updatedAt: string;
}

export interface MagicSpellFormula {
	actionId: string;
	actionSlug: string;
	actionName: string;
	essenceId: string;
	essenceSlug: string;
	essenceName: string;
	name: string;
}

export interface MagicWordsCatalog {
	words: MagicWord[];
}

export interface MagicSpellFormulasCatalog {
	formulas: MagicSpellFormula[];
}

export const MAGIC_WORD_TYPE_OPTIONS: Array<{
	value: MagicWordType;
	label: string;
	pluralLabel: string;
}> = [
	{ value: 'ACTION', label: 'Действие', pluralLabel: 'Действия' },
	{ value: 'ESSENCE', label: 'Сущность', pluralLabel: 'Сущности' },
	{ value: 'GESTURE', label: 'Жест', pluralLabel: 'Жесты' },
	{ value: 'MODIFIER', label: 'Модификатор', pluralLabel: 'Модификаторы' }
];

export function magicWordTypeLabel(type: MagicWordType) {
	return (
		MAGIC_WORD_TYPE_OPTIONS.find(option => option.value === type)?.label ??
		'Слово'
	);
}

export function magicWordTypePluralLabel(type: MagicWordType) {
	return (
		MAGIC_WORD_TYPE_OPTIONS.find(option => option.value === type)?.pluralLabel ??
		'Слова'
	);
}
