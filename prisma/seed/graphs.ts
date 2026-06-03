export function createSumGraph(sourceValueIds: string[]) {
	const sourceNodes = sourceValueIds.map((sourceValueId, index) => ({
		id: `source-${index}`,
		kind: 'source',
		x: 120,
		y: 80 + index * 96,
		sourceValueId
	}));

	return {
		nodes: [
			...sourceNodes,
			{
				id: 'sum',
				kind: 'operation',
				x: 420,
				y: 120,
				operation: 'sum'
			},
			{ id: 'result', kind: 'result', x: 720, y: 120 }
		],
		edges: [
			...sourceNodes.map(node => ({
				id: `${node.id}:out -> sum:in`,
				source: node.id,
				target: 'sum',
				sourceHandle: 'out',
				targetHandle: 'in'
			})),
			{
				id: 'sum:out -> result:in',
				source: 'sum',
				target: 'result',
				sourceHandle: 'out',
				targetHandle: 'in'
			}
		]
	};
}

export function createPotentialGraph(params: {
	bodyValueId: string;
	mindValueId: string;
	fatigueLevelValueId: string;
}) {
	return {
		nodes: [
			{
				id: 'body-value',
				kind: 'source',
				x: 120,
				y: 80,
				sourceValueId: params.bodyValueId
			},
			{
				id: 'mind-value',
				kind: 'source',
				x: 120,
				y: 200,
				sourceValueId: params.mindValueId
			},
			{
				id: 'fatigue-level',
				kind: 'source',
				x: 120,
				y: 340,
				sourceValueId: params.fatigueLevelValueId
			},
			{
				id: 'zero',
				kind: 'constant',
				x: 600,
				y: 360,
				constantValue: 0
			},
			{
				id: 'sum-attributes',
				kind: 'operation',
				x: 360,
				y: 140,
				operation: 'sum'
			},
			{
				id: 'subtract-fatigue',
				kind: 'operation',
				x: 600,
				y: 200,
				operation: 'subtract'
			},
			{
				id: 'clamp-min-zero',
				kind: 'operation',
				x: 840,
				y: 240,
				operation: 'max'
			},
			{ id: 'result', kind: 'result', x: 1080, y: 240 }
		],
		edges: [
			{
				id: 'body-value:out -> sum-attributes:in',
				source: 'body-value',
				target: 'sum-attributes',
				sourceHandle: 'out',
				targetHandle: 'in'
			},
			{
				id: 'mind-value:out -> sum-attributes:in',
				source: 'mind-value',
				target: 'sum-attributes',
				sourceHandle: 'out',
				targetHandle: 'in'
			},
			{
				id: 'sum-attributes:out -> subtract-fatigue:a',
				source: 'sum-attributes',
				target: 'subtract-fatigue',
				sourceHandle: 'out',
				targetHandle: 'a'
			},
			{
				id: 'fatigue-level:out -> subtract-fatigue:b',
				source: 'fatigue-level',
				target: 'subtract-fatigue',
				sourceHandle: 'out',
				targetHandle: 'b'
			},
			{
				id: 'subtract-fatigue:out -> clamp-min-zero:in',
				source: 'subtract-fatigue',
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

export function createThresholdCounterRollEventGraph(params: {
	accumulatorValueId: string;
	thresholdValueId: string;
	overflowValueId: string;
}) {
	return {
		nodes: [
			{
				id: 'event-consequence-count',
				kind: 'eventInput',
				x: 120,
				y: 180,
				eventInputKey: 'consequenceCount'
			},
			{
				id: 'threshold-counter',
				kind: 'thresholdCounter',
				x: 520,
				y: 150,
				accumulatorValueId: params.accumulatorValueId,
				thresholdValueId: params.thresholdValueId,
				overflowValueId: params.overflowValueId,
				thresholdSource: 'final',
				resetMode: 'zero',
				overflowMode: 'single',
				overflowIncrement: 1
			}
		],
		edges: [
			{
				id: 'event-consequence-count:out -> threshold-counter:increment',
				source: 'event-consequence-count',
				target: 'threshold-counter',
				sourceHandle: 'out',
				targetHandle: 'increment'
			}
		]
	};
}

export function createSourceGainRollEventGraph(sourceValueId: string) {
	return {
		nodes: [
			{
				id: 'event-sixes',
				kind: 'eventInput',
				x: 120,
				y: 120,
				eventInputKey: 'sixes'
			},
			{
				id: 'current-source',
				kind: 'valueSource',
				x: 120,
				y: 260,
				sourceValueId
			},
			{
				id: 'sum-source',
				kind: 'operation',
				x: 420,
				y: 180,
				operation: 'sum'
			},
			{
				id: 'write-source',
				kind: 'writeValue',
				x: 720,
				y: 180,
				targetValueId: sourceValueId
			}
		],
		edges: [
			{
				id: 'event-sixes:out -> sum-source:in',
				source: 'event-sixes',
				target: 'sum-source',
				sourceHandle: 'out',
				targetHandle: 'in'
			},
			{
				id: 'current-source:out -> sum-source:in',
				source: 'current-source',
				target: 'sum-source',
				sourceHandle: 'out',
				targetHandle: 'in'
			},
			{
				id: 'sum-source:out -> write-source:value',
				source: 'sum-source',
				target: 'write-source',
				sourceHandle: 'out',
				targetHandle: 'value'
			}
		]
	};
}
