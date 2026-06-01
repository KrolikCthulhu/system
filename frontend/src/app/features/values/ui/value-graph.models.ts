export type ValueKind = 'attribute' | 'characteristic' | 'skill';
export type ValueMode = 'manual' | 'formula';

export type GraphNodeKind =
	| 'characterInput'
	| 'source'
	| 'constant'
	| 'operation'
	| 'comparison'
	| 'condition'
	| 'curve'
	| 'result';

export type GraphOperation =
	| 'sum'
	| 'average'
	| 'min'
	| 'max'
	| 'multiply'
	| 'subtract'
	| 'divide';

export type GraphComparison = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';

export interface CurveRange {
	id: string;
	from: number;
	to: number;
	result: number;
}

export interface ValueGraphNodeState {
	id: string;
	kind: GraphNodeKind;
	x: number;
	y: number;
	sourceValueId?: string | null;
	constantValue?: number;
	operation?: GraphOperation;
	comparison?: GraphComparison;
	curveRanges?: CurveRange[];
}

export interface ValueGraphEdgeState {
	id: string;
	source: string;
	target: string;
	sourceHandle?: string;
	targetHandle?: string;
}

export interface ValueGraphState {
	nodes: ValueGraphNodeState[];
	edges: ValueGraphEdgeState[];
}

export interface ValueGraphNodeData {
	kind: GraphNodeKind;
	sourceValueId?: string | null;
	sourceValueName?: string | null;
	constantValue?: number;
	operation?: GraphOperation;
	comparison?: GraphComparison;
	curveRanges?: CurveRange[];
}
