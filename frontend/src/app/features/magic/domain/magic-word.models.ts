export type MagicWordType = 'ACTION' | 'ESSENCE' | 'GESTURE' | 'MODIFIER';

export interface MagicWordGestureOption {
	id: string;
	name: string;
}

export interface MagicWord {
	id: string;
	type: MagicWordType;
	name: string;
	description: string;
	isActive: boolean;
	sortOrder: number;
	allowedGestureIds: string[];
	allowedGestures: MagicWordGestureOption[];
	createdAt: string;
	updatedAt: string;
}

export interface MagicSpellFormula {
	actionId: string;
	actionName: string;
	essenceId: string;
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
