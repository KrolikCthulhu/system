export type JsonObject = Record<string, unknown>;
export type RuntimeValue = string | number | boolean | JsonObject | null;
export type RuntimeActionResultMap = Record<string, RuntimeValue>;
export type SpellRuntimePreviewIdGenerator = () => string;

export const spellMechanicActionKinds = {
	roll: 'ROLL',
	check: 'CHECK',
	comparison: 'COMPARISON',
	calculation: 'CALCULATION',
	branch: 'BRANCH',
	effectScale: 'EFFECT_SCALE',
	valueChange: 'VALUE_CHANGE',
	conditionAdd: 'CONDITION_ADD',
	conditionRemove: 'CONDITION_REMOVE',
	text: 'TEXT',
	custom: 'CUSTOM'
} as const;

export type SpellMechanicActionKind =
	(typeof spellMechanicActionKinds)[keyof typeof spellMechanicActionKinds];

export interface RuntimeTraceEntry {
	id: string;
	blockId: string;
	blockName: string;
	actionId: string;
	actionName: string;
	actionKind: string;
	status: 'executed' | 'pending';
	message: string;
	results: RuntimeActionResultMap;
	children: RuntimeTraceEntry[];
}

export interface RuntimePendingRoll {
	blockId: string;
	blockName: string;
	actionId: string;
	actionName: string;
	resultName: string;
	actor: RuntimeValue;
	skill: RuntimeValue;
	optional: boolean;
}

export interface RuntimePendingChoice {
	blockId: string;
	blockName: string;
	actionId: string;
	actionName: string;
	resultName: string;
	sourceValue: number;
	options: Array<{
		id: string;
		requirement: 'automatic' | 'successes';
		threshold: number;
		name: string;
		description: string;
	}>;
}

export interface RuntimeEffect {
	kind: 'valueChange' | 'conditionAdd' | 'conditionRemove' | 'text';
	blockId: string;
	blockName: string;
	actionId: string;
	actionName: string;
	target?: RuntimeValue;
	systemValueId?: string | null;
	systemValueName?: string | null;
	operation?: string;
	amount?: number;
	conditionId?: string | null;
	duration?: number | null;
	text?: string;
}

export interface RuntimeContext {
	inputValues: Record<string, number>;
	rollResults: Record<string, number>;
	choiceResults: Record<string, string>;
	mechanicsById: Map<string, RuntimeMechanic>;
	resultsByActionId: Map<string, RuntimeActionResultMap>;
	trace: RuntimeTraceEntry[];
	traceParentStack: RuntimeTraceEntry[];
	pendingRolls: RuntimePendingRoll[];
	pendingChoices: RuntimePendingChoice[];
	effects: RuntimeEffect[];
	logs: string[];
	halted: boolean;
	blocked: boolean;
}

export interface RuntimeSpell {
	id: string;
	name: string;
	action: { id: string; name: string };
	essence: {
		id: string;
		name: string;
		skillLinks: Array<{
			skillId: string;
			skill: {
				id: string;
				name: string;
				sortOrder: number;
				systemValueId: string;
			};
		}>;
		damageTypeLinks: unknown[];
		conditionLinks: unknown[];
	};
	gesture: { id: string; name: string };
	targetConfigs: unknown;
	mechanicBlocks: RuntimeBlock[];
}

export interface RuntimeBlock {
	id: string;
	parameterValues: unknown;
	config: unknown;
	isActive: boolean;
	sortOrder: number;
	mechanic: RuntimeMechanic;
}

export interface RuntimeMechanic {
	id: string;
	name: string;
	parameters: RuntimeParameter[];
	actions: RuntimeAction[];
}

export interface RuntimeParameter {
	id: string;
	slug: string;
	name: string;
	kind: string;
	defaultMode: string;
	staticSkillId: string | null;
	staticDamageTypeId: string | null;
	staticConditionId: string | null;
	staticSystemValueId: string | null;
	staticTextValue: string | null;
	sortOrder: number;
}

export interface RuntimeAction {
	id: string;
	name: string;
	kind: SpellMechanicActionKind;
	config: unknown;
	isActive: boolean;
	sortOrder: number;
}

export interface RuntimeEffectScaleItem {
	id: string;
	requirement: 'automatic' | 'successes';
	threshold: number;
	name: string;
	description: string;
	mechanicBlocks: RuntimeBlock[];
	actions: RuntimeAction[];
}

export interface ExecuteSpellRuntimePreviewInput {
	spell: RuntimeSpell;
	mechanics: RuntimeMechanic[];
	inputValues?: Record<string, unknown>;
	rollResults?: Record<string, unknown>;
	choiceResults?: Record<string, unknown>;
}

export interface SpellRuntimePreviewSuccess {
	ok: true;
	value: {
		spell: {
			id: string;
			name: string;
			formulaName: string;
		};
		status:
			| 'BLOCKED'
			| 'WAITING_FOR_ROLLS'
			| 'WAITING_FOR_CHOICE'
			| 'COMPLETED';
		pendingRolls: RuntimePendingRoll[];
		pendingChoices: RuntimePendingChoice[];
		effects: RuntimeEffect[];
		actionResults: Record<string, RuntimeActionResultMap>;
		trace: RuntimeTraceEntry[];
		logs: string[];
	};
}

export type SpellRuntimePreviewErrorCode =
	| 'unsupported_action'
	| 'invalid_effect_scale'
	| 'invalid_choice'
	| 'unsupported_parameter_mode'
	| 'invalid_calculation_graph'
	| 'invalid_input';

export interface SpellRuntimePreviewFailure {
	ok: false;
	error: {
		code: SpellRuntimePreviewErrorCode;
		message: string;
	};
}

export type SpellRuntimePreviewResult =
	| SpellRuntimePreviewSuccess
	| SpellRuntimePreviewFailure;
