import { ValueGraphState } from '../../features/values/ui/value-graph.models';

export type SystemValueSourceType =
	| 'attribute'
	| 'characteristic'
	| 'skill'
	| 'roll-consequence'
	| 'manual';

export interface SystemValueDefinition {
	id: string;
	calculationGraph: ValueGraphState | null;
}

export function createSystemValueDefinition(id: string): SystemValueDefinition {
	return {
		id,
		calculationGraph: createCharacterInputGraph()
	};
}

export function createCharacterInputGraph() {
	return {
		nodes: [
			{ id: 'character-input', kind: 'characterInput' as const, x: 120, y: 120 },
			{ id: 'result', kind: 'result' as const, x: 420, y: 120 }
		],
		edges: [
			{
				id: 'character-input:out -> result:in',
				source: 'character-input',
				target: 'result',
				sourceHandle: 'out',
				targetHandle: 'in'
			}
		]
	};
}
