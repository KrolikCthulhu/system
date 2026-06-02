import { signal } from '@angular/core';
import { ComponentNode, Edge } from 'ngx-vflow';
import { RollEventGraphNodeComponent } from '../ui/components/roll-event-graph-node/roll-event-graph-node.component';
import {
	RollEventGraphComparison,
	RollEventGraphDefinition,
	RollEventGraphEdgeState,
	RollEventGraphNodeData,
	RollEventGraphNodeKind,
	RollEventGraphNodeState
} from './roll-event-graph.models';

export function createRollEventGraphNodeState(
	kind: RollEventGraphNodeKind,
	index: number
): RollEventGraphNodeState {
	const id = `${kind}-${crypto.randomUUID()}`;
	const x =
		kind === 'writeValue'
			? 780
			: kind === 'condition'
				? 560
				: kind === 'comparison'
					? 380
					: 120 + (index % 2) * 160;
	const y = 48 + index * 74;

	switch (kind) {
		case 'eventInput':
			return { id, kind, x, y, eventInputKey: 'consequenceCount' };
		case 'valueSource':
			return { id, kind, x, y, sourceValueId: null };
		case 'constant':
			return { id, kind, x, y, constantValue: 0 };
		case 'operation':
			return { id, kind, x, y, operation: 'sum' };
		case 'comparison':
			return { id, kind, x, y, comparison: 'gte' };
		case 'condition':
			return { id, kind, x, y };
		case 'thresholdCounter':
			return {
				id,
				kind,
				x: 560,
				y,
				accumulatorValueId: null,
				thresholdValueId: null,
				overflowValueId: null,
				thresholdSource: 'base',
				resetMode: 'zero',
				overflowIncrement: 1
			};
		case 'writeValue':
			return { id, kind, x, y, targetValueId: null };
	}
}

export function createRollEventRuntimeNode(
	node: RollEventGraphNodeState,
	valueNames: Map<string, string>
): ComponentNode<RollEventGraphNodeData> {
	return {
		id: node.id,
		point: signal({ x: node.x, y: node.y }),
		type: RollEventGraphNodeComponent,
		data: signal({
			kind: node.kind,
			eventInputKey: node.eventInputKey,
			sourceValueId: node.sourceValueId ?? null,
			sourceValueName: node.sourceValueId
				? (valueNames.get(node.sourceValueId) ?? null)
				: null,
			targetValueId: node.targetValueId ?? null,
			targetValueName: node.targetValueId
				? (valueNames.get(node.targetValueId) ?? null)
				: null,
			accumulatorValueId: node.accumulatorValueId ?? null,
			accumulatorValueName: node.accumulatorValueId
				? (valueNames.get(node.accumulatorValueId) ?? null)
				: null,
			overflowValueId: node.overflowValueId ?? null,
			overflowValueName: node.overflowValueId
				? (valueNames.get(node.overflowValueId) ?? null)
				: null,
			thresholdValueId: node.thresholdValueId ?? null,
			thresholdValueName: node.thresholdValueId
				? (valueNames.get(node.thresholdValueId) ?? null)
				: null,
			thresholdSource: node.thresholdSource ?? 'base',
			resetMode: node.resetMode ?? 'zero',
			overflowIncrement: node.overflowIncrement ?? 1,
			constantValue: node.constantValue,
			operation: node.operation,
			comparison: node.comparison
		})
	};
}

export function serializeRollEventGraphNode(
	node: ComponentNode<RollEventGraphNodeData>
): RollEventGraphNodeState {
	const data = node.data?.();

	return {
		id: node.id,
		kind: data?.kind ?? 'constant',
		x: node.point().x,
		y: node.point().y,
		eventInputKey: data?.eventInputKey,
		sourceValueId: data?.sourceValueId ?? null,
		targetValueId: data?.targetValueId ?? null,
		accumulatorValueId: data?.accumulatorValueId ?? null,
		overflowValueId: data?.overflowValueId ?? null,
		thresholdValueId: data?.thresholdValueId ?? null,
		thresholdSource: data?.thresholdSource,
		resetMode: data?.resetMode,
		overflowIncrement: data?.overflowIncrement,
		constantValue: data?.constantValue,
		operation: data?.operation,
		comparison: data?.comparison
	};
}

export function serializeRollEventGraphEdge(
	edge: Edge
): RollEventGraphEdgeState {
	return {
		id: edge.id,
		source: edge.source,
		target: edge.target,
		sourceHandle: edge.sourceHandle,
		targetHandle: edge.targetHandle
	};
}

export function normalizeRollEventGraph(
	graph: RollEventGraphDefinition | null | undefined
): RollEventGraphDefinition | null {
	if (!graph) {
		return null;
	}

	const nodes = graph.nodes.map(normalizeNode);
	const edges = graph.edges.map(edge => ({
		id: edge.id,
		source: edge.source,
		target: edge.target,
		...(edge.sourceHandle ? { sourceHandle: edge.sourceHandle } : {}),
		...(edge.targetHandle ? { targetHandle: edge.targetHandle } : {})
	}));

	if (!nodes.length && !edges.length) {
		return null;
	}

	return { nodes, edges };
}

function normalizeNode(node: RollEventGraphNodeState): RollEventGraphNodeState {
	const normalized: RollEventGraphNodeState = {
		id: node.id,
		kind: node.kind,
		x: node.x,
		y: node.y
	};

	if (node.kind === 'eventInput') {
		normalized.eventInputKey = node.eventInputKey ?? 'consequenceCount';
	}

	if (node.kind === 'valueSource') {
		normalized.sourceValueId = node.sourceValueId ?? null;
	}

	if (node.kind === 'writeValue') {
		normalized.targetValueId = node.targetValueId ?? null;
	}

	if (node.kind === 'thresholdCounter') {
		normalized.accumulatorValueId = node.accumulatorValueId ?? null;
		normalized.overflowValueId = node.overflowValueId ?? null;
		normalized.thresholdValueId = node.thresholdValueId ?? null;
		normalized.thresholdSource = node.thresholdSource ?? 'base';
		normalized.resetMode = node.resetMode ?? 'zero';
		normalized.overflowIncrement = node.overflowIncrement ?? 1;
	}

	if (node.kind === 'constant') {
		normalized.constantValue = node.constantValue ?? 0;
	}

	if (node.kind === 'operation') {
		normalized.operation = node.operation ?? 'sum';
	}

	if (node.kind === 'comparison') {
		normalized.comparison = normalizeComparison(node.comparison);
	}

	return normalized;
}

function normalizeComparison(
	comparison: RollEventGraphComparison | undefined
): RollEventGraphComparison {
	return comparison ?? 'gte';
}
