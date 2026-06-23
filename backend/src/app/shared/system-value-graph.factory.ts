export function createCharacterInputGraph() {
	return {
		nodes: [
			{ id: 'character-input', kind: 'characterInput', x: 120, y: 120 },
			{ id: 'result', kind: 'result', x: 420, y: 120 }
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

export function createAvailablePoolGraph(
	attributeValueId: string,
	penaltyValueId: string | null
) {
	return {
		nodes: [
			{
				id: 'attribute-value',
				kind: 'source',
				x: 120,
				y: 80,
				sourceValueId: attributeValueId
			},
			{
				id: 'penalty-value',
				kind: penaltyValueId ? 'source' : 'constant',
				x: 120,
				y: 220,
				...(penaltyValueId
					? { sourceValueId: penaltyValueId }
					: { constantValue: 0 })
			},
			{
				id: 'zero',
				kind: 'constant',
				x: 360,
				y: 240,
				constantValue: 0
			},
			{
				id: 'subtract-penalty',
				kind: 'operation',
				x: 360,
				y: 120,
				operation: 'subtract'
			},
			{
				id: 'clamp-min-zero',
				kind: 'operation',
				x: 600,
				y: 140,
				operation: 'max'
			},
			{ id: 'result', kind: 'result', x: 840, y: 140 }
		],
		edges: [
			{
				id: 'attribute-value:out -> subtract-penalty:a',
				source: 'attribute-value',
				target: 'subtract-penalty',
				sourceHandle: 'out',
				targetHandle: 'a'
			},
			{
				id: 'penalty-value:out -> subtract-penalty:b',
				source: 'penalty-value',
				target: 'subtract-penalty',
				sourceHandle: 'out',
				targetHandle: 'b'
			},
			{
				id: 'subtract-penalty:out -> clamp-min-zero:in',
				source: 'subtract-penalty',
				target: 'clamp-min-zero',
				sourceHandle: 'out',
				targetHandle: 'in'
			},
			{
				id: 'zero:out -> clamp-min-zero:in',
				source: 'zero',
				target: 'clamp-min-zero',
				sourceHandle: 'out',
				targetHandle: 'in'
			},
			{
				id: 'clamp-min-zero:out -> result:in',
				source: 'clamp-min-zero',
				target: 'result',
				sourceHandle: 'out',
				targetHandle: 'in'
			}
		]
	};
}
