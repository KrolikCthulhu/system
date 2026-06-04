export type MechanicCalculationSourceKind =
	| 'mechanicParameter'
	| 'actionResult';

export type MechanicCalculationNodeKind =
	| 'source'
	| 'constant'
	| 'operation'
	| 'comparison'
	| 'condition'
	| 'result';

export type MechanicCalculationOperation =
	| 'sum'
	| 'average'
	| 'min'
	| 'max'
	| 'multiply'
	| 'subtract'
	| 'divide';

export type MechanicCalculationComparison =
	| 'eq'
	| 'ne'
	| 'gt'
	| 'gte'
	| 'lt'
	| 'lte';

export interface MechanicCalculationSource {
	id: string;
	name: string;
	searchText: string;
}

export interface MechanicCalculationSourceGroup {
	label: string;
	items: MechanicCalculationSource[];
}

export interface MechanicCalculationGraphNodeState {
	id: string;
	kind: MechanicCalculationNodeKind;
	x: number;
	y: number;
	sourceId?: string | null;
	constantValue?: number;
	operation?: MechanicCalculationOperation;
	comparison?: MechanicCalculationComparison;
}

export interface MechanicCalculationGraphEdgeState {
	id: string;
	source: string;
	target: string;
	sourceHandle?: string;
	targetHandle?: string;
}

export interface MechanicCalculationGraphState {
	nodes: MechanicCalculationGraphNodeState[];
	edges: MechanicCalculationGraphEdgeState[];
}

export interface MechanicCalculationGraphNodeData {
	kind: MechanicCalculationNodeKind;
	sourceId?: string | null;
	sourceName?: string | null;
	constantValue?: number;
	operation?: MechanicCalculationOperation;
	comparison?: MechanicCalculationComparison;
}
