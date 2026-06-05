export type SpellStatus = 'EMPTY' | 'DRAFT' | 'TESTING' | 'READY';
export type PersistedSpellStatus = Exclude<SpellStatus, 'EMPTY'>;

export interface SpellFormulaWord {
	id: string;
	name: string;
}

export interface Spell {
	id: string;
	actionId: string;
	essenceId: string;
	gestureId: string;
	name: string;
	description: string;
	status: PersistedSpellStatus;
	isActive: boolean;
	sortOrder: number;
	formulaName: string;
	action: SpellFormulaWord;
	essence: SpellFormulaWord;
	gesture: SpellFormulaWord;
	targetConfigs: SpellTargetConfig[];
	mechanicBlocks: SpellMechanicBlock[];
	createdAt: string;
	updatedAt: string;
}

export type SpellTargetSource = 'caster' | 'selected' | 'area';
export type SpellTargetRelation = 'self' | 'any' | 'enemy' | 'ally';
export type SpellTargetCountMode = 'one' | 'all' | 'upTo' | 'exact';
export type SpellTargetCountValueMode = 'fixed' | 'formula';

export interface SpellTargetConfig {
	id: string;
	name: string;
	source: SpellTargetSource;
	relation: SpellTargetRelation;
	countMode: SpellTargetCountMode;
	countValueMode: SpellTargetCountValueMode;
	countValue: number;
	countFormula: string;
	isRequired: boolean;
	sortOrder: number;
}

export interface SpellMechanicBlock {
	id: string;
	mechanicId: string;
	parameterValues: Record<string, unknown>;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface SpellFormulaCandidate {
	key: string;
	action: SpellFormulaWord;
	essence: SpellFormulaWord;
	gesture: SpellFormulaWord;
	status: SpellStatus;
	isActive: boolean;
	spell: Spell | null;
}

export interface SpellFormulaGroup {
	key: string;
	action: SpellFormulaWord;
	essence: SpellFormulaWord;
	label: string;
	formulas: SpellFormulaCandidate[];
}

export interface SpellCatalog {
	groups: SpellFormulaGroup[];
}

export const SPELL_STATUS_OPTIONS: Array<{
	value: PersistedSpellStatus;
	label: string;
}> = [
	{ value: 'DRAFT', label: 'Черновик' },
	{ value: 'TESTING', label: 'Тестируется' },
	{ value: 'READY', label: 'Готово' }
];

export const SPELL_FILTER_STATUS_OPTIONS: Array<{
	value: SpellStatus | 'ALL';
	label: string;
}> = [
	{ value: 'ALL', label: 'Все статусы' },
	{ value: 'EMPTY', label: 'Не заполнено' },
	{ value: 'DRAFT', label: 'Черновик' },
	{ value: 'TESTING', label: 'Тестируется' },
	{ value: 'READY', label: 'Готово' }
];

export function spellStatusLabel(status: SpellStatus) {
	switch (status) {
		case 'EMPTY':
			return 'Не заполнено';
		case 'DRAFT':
			return 'Черновик';
		case 'TESTING':
			return 'Тестируется';
		case 'READY':
			return 'Готово';
	}
}

export function canManageSpellActivity(status: PersistedSpellStatus) {
	return status === 'TESTING' || status === 'READY';
}
