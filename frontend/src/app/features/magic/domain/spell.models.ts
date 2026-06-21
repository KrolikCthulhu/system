export type SpellStatus = 'EMPTY' | 'DRAFT' | 'TESTING' | 'READY';
export type PersistedSpellStatus = Exclude<SpellStatus, 'EMPTY'>;

export interface SpellFormulaWord {
	id: string;
	slug: string;
	name: string;
}

export interface Spell {
	id: string;
	actionId: string;
	essenceId: string;
	gestureId: string;
	name: string;
	description: string;
	config: SpellConfig;
	status: PersistedSpellStatus;
	isActive: boolean;
	sortOrder: number;
	formulaName: string;
	action: SpellFormulaWord;
	essence: SpellFormulaWord;
	gesture: SpellFormulaWord;
	targetConfigs: SpellTargetConfig[];
	textBlocks: SpellTextBlock[];
	mechanicBlocks: SpellMechanicBlock[];
	createdAt: string;
	updatedAt: string;
}

export interface SpellConfig {
	area?: SpellAreaConfig;
}

export interface SpellAreaConfig {
	gestureId: string;
	shapeKind: string;
	dimensions: Record<string, unknown>;
}

export type SpellTextBlockKind = 'text' | 'mechanicText';

export interface SpellTextBlock {
	id: string;
	kind: SpellTextBlockKind;
	text: string;
	mechanicBlockId: string;
	isActive: boolean;
	sortOrder: number;
}

export type SpellTargetSource = 'caster' | 'selected' | 'area';
export type SpellTargetRelation = 'self' | 'any' | 'enemy' | 'ally';
export type SpellTargetCountMode = 'one' | 'all' | 'upTo' | 'exact';
export type SpellTargetCountValueMode = 'fixed' | 'formula' | 'parameter';

export interface SpellTargetConfig {
	id: string;
	name: string;
	source: SpellTargetSource;
	relation: SpellTargetRelation;
	countMode: SpellTargetCountMode;
	countValueMode: SpellTargetCountValueMode;
	countValue: number;
	countFormula: string;
	targetCountParameterId: string;
	isRequired: boolean;
	sortOrder: number;
}

export interface SpellMechanicBlock {
	id: string;
	mechanicId: string;
	parameterValues: Record<string, unknown>;
	config: SpellMechanicBlockConfig;
	isActive: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface SpellMechanicBlockConfig {
	effectScale?: SpellEffectScaleConfig;
}

export type SpellEffectScaleMode = 'best' | 'choice' | 'all' | 'exact';

export interface SpellEffectScaleConfig {
	mode: SpellEffectScaleMode;
	resultName: string;
	items: SpellEffectScaleItemConfig[];
}

export interface SpellEffectScaleItemConfig {
	id: string;
	threshold: number;
	name: string;
	description: string;
	isOpenEnded: boolean;
	mechanicBlocks: SpellNestedMechanicBlockConfig[];
}

export interface SpellNestedMechanicBlockConfig {
	id: string;
	mechanicId: string;
	parameterValues: Record<string, unknown>;
	config: SpellMechanicBlockConfig;
	isActive: boolean;
	sortOrder: number;
}

export interface SpellRuntimePreviewRequest {
	inputValues?: Record<string, number>;
	rollResults?: Record<string, number>;
	choiceResults?: Record<string, string>;
}

export type SpellRuntimePreviewStatus =
	| 'WAITING_FOR_ROLLS'
	| 'WAITING_FOR_CHOICE'
	| 'COMPLETED';

export interface SpellRuntimePreview {
	spell: {
		id: string;
		name: string;
		formulaName: string;
	};
	status: SpellRuntimePreviewStatus;
	pendingRolls: SpellRuntimePendingRoll[];
	pendingChoices: SpellRuntimePendingChoice[];
	effects: SpellRuntimeEffect[];
	actionResults: Record<string, Record<string, unknown>>;
	trace: SpellRuntimeTraceEntry[];
	logs: string[];
}

export interface SpellRuntimePendingRoll {
	blockId: string;
	blockName: string;
	actionId: string;
	actionName: string;
	resultName: string;
	actor: unknown;
	skill: unknown;
	optional: boolean;
}

export interface SpellRuntimePendingChoice {
	blockId: string;
	blockName: string;
	actionId: string;
	actionName: string;
	resultName: string;
	sourceValue: number;
	options: Array<{
		id: string;
		threshold: number;
		name: string;
		description: string;
	}>;
}

export interface SpellRuntimeEffect {
	kind: 'valueChange' | 'conditionAdd' | 'conditionRemove' | 'text';
	blockId: string;
	blockName: string;
	actionId: string;
	actionName: string;
	target?: unknown;
	systemValueId?: string | null;
	systemValueName?: string | null;
	operation?: string;
	amount?: number;
	conditionId?: string | null;
	duration?: number | null;
	text?: string;
}

export interface SpellRuntimeTraceEntry {
	id: string;
	blockId: string;
	blockName: string;
	actionId: string;
	actionName: string;
	actionKind: string;
	status: 'executed' | 'pending';
	message: string;
	results: Record<string, unknown>;
	children: SpellRuntimeTraceEntry[];
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
