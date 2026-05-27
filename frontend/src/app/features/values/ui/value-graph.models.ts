export type ValueKind = 'attribute' | 'characteristic' | 'skill';
export type ValueMode = 'manual' | 'formula';

export type GraphNodeKind =
	| 'source'
	| 'constant'
	| 'operation'
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
	curveRanges?: CurveRange[];
}
