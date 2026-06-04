import { signal } from '@angular/core';
import { ComponentNode, Edge } from 'ngx-vflow';
import { MechanicCalculationGraphNodeComponent } from './components/mechanic-calculation-graph-node/mechanic-calculation-graph-node.component';
import {
	MechanicCalculationComparison,
	MechanicCalculationGraphEdgeState,
	MechanicCalculationGraphNodeData,
	MechanicCalculationGraphNodeState,
	MechanicCalculationGraphState,
	MechanicCalculationNodeKind
} from './mechanic-calculation-graph.models';

export function createMechanicCalculationNodeState(
	kind: MechanicCalculationNodeKind,
	index: number
): MechanicCalculationGraphNodeState {
	const id = `${kind}-${crypto.randomUUID()}`;
	const x =
		kind === 'result'
			? 760
			: kind === 'condition'
				? 540
				: kind === 'comparison'
					? 360
					: 120 + (index % 2) * 160;
	const y = 48 + index * 72;

	switch (kind) {
		case 'source':
			return { id, kind, x, y, sourceId: null };
		case 'constant':
			return { id, kind, x, y, constantValue: 0 };
		case 'operation':
			return { id, kind, x, y, operation: 'sum' };
		case 'comparison':
			return { id, kind, x, y, comparison: 'gte' };
		case 'condition':
			return { id, kind, x, y };
		case 'result':
			return { id, kind, x, y };
	}
}

export function createMechanicCalculationRuntimeNode(
	node: MechanicCalculationGraphNodeState,
	sourceName: string | null
): ComponentNode<MechanicCalculationGraphNodeData> {
	return {
		id: node.id,
		point: signal({ x: node.x, y: node.y }),
		type: MechanicCalculationGraphNodeComponent,
		data: signal({
			kind: node.kind,
			sourceId: node.sourceId ?? null,
			sourceName,
			constantValue: node.constantValue,
			operation: node.operation,
			comparison: node.comparison
		})
	};
}

export function serializeMechanicCalculationNode(
	node: ComponentNode<MechanicCalculationGraphNodeData>
): MechanicCalculationGraphNodeState {
	const data = node.data?.();

	return {
		id: node.id,
		kind: data?.kind ?? 'constant',
		x: node.point().x,
		y: node.point().y,
		sourceId: data?.sourceId ?? null,
		constantValue: data?.constantValue,
		operation: data?.operation,
		comparison: data?.comparison
	};
}

export function serializeMechanicCalculationEdge(
	edge: Edge
): MechanicCalculationGraphEdgeState {
	return {
		id: edge.id,
		source: edge.source,
		target: edge.target,
		sourceHandle: edge.sourceHandle,
		targetHandle: edge.targetHandle
	};
}

export function normalizeMechanicCalculationGraph(
	graph: MechanicCalculationGraphState | null | undefined
): MechanicCalculationGraphState | null {
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

function normalizeNode(
	node: MechanicCalculationGraphNodeState
): MechanicCalculationGraphNodeState {
	const normalized: MechanicCalculationGraphNodeState = {
		id: node.id,
		kind: node.kind,
		x: node.x,
		y: node.y
	};

	if (node.kind === 'source') {
		normalized.sourceId = node.sourceId ?? null;
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
	comparison: MechanicCalculationComparison | undefined
): MechanicCalculationComparison {
	return comparison ?? 'gte';
}
