export type RollEventGraphNodeKind =
	| 'eventInput'
	| 'valueSource'
	| 'constant'
	| 'operation'
	| 'comparison'
	| 'condition'
	| 'thresholdCounter'
	| 'writeValue';

export type RollEventInputKey =
	| 'diceCount'
	| 'successes'
	| 'sixes'
	| 'ones'
	| 'ignoredOnes'
	| 'consequenceCount'
	| 'skillLevel';

export type RollEventGraphOperation =
	| 'sum'
	| 'min'
	| 'max'
	| 'multiply'
	| 'subtract'
	| 'divide';

export type RollEventGraphComparison = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';
export type RollEventThresholdSource = 'base' | 'final';
export type RollEventThresholdResetMode = 'zero' | 'subtractThreshold';
export type RollEventThresholdOverflowMode = 'single' | 'multiple';

export interface RollEventGraphNodeState {
	id: string;
	kind: RollEventGraphNodeKind;
	x: number;
	y: number;
	eventInputKey?: RollEventInputKey;
	sourceValueId?: string | null;
	targetValueId?: string | null;
	accumulatorValueId?: string | null;
	overflowValueId?: string | null;
	thresholdValueId?: string | null;
	thresholdSource?: RollEventThresholdSource;
	resetMode?: RollEventThresholdResetMode;
	overflowMode?: RollEventThresholdOverflowMode;
	overflowIncrement?: number;
	constantValue?: number;
	operation?: RollEventGraphOperation;
	comparison?: RollEventGraphComparison;
}

export interface RollEventGraphEdgeState {
	id: string;
	source: string;
	target: string;
	sourceHandle?: string;
	targetHandle?: string;
}

export interface RollEventGraphDefinition {
	nodes: RollEventGraphNodeState[];
	edges: RollEventGraphEdgeState[];
}

export interface RollEventGraphNodeData {
	kind: RollEventGraphNodeKind;
	eventInputKey?: RollEventInputKey;
	sourceValueId?: string | null;
	sourceValueName?: string | null;
	targetValueId?: string | null;
	targetValueName?: string | null;
	accumulatorValueId?: string | null;
	accumulatorValueName?: string | null;
	overflowValueId?: string | null;
	overflowValueName?: string | null;
	thresholdValueId?: string | null;
	thresholdValueName?: string | null;
	thresholdSource?: RollEventThresholdSource;
	resetMode?: RollEventThresholdResetMode;
	overflowMode?: RollEventThresholdOverflowMode;
	overflowIncrement?: number;
	constantValue?: number;
	operation?: RollEventGraphOperation;
	comparison?: RollEventGraphComparison;
}
