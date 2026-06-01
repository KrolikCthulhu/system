import { signal } from '@angular/core';
import { ComponentNode, Edge } from 'ngx-vflow';
import { ValueGraphNodeComponent } from '../ui/components/value-graph-node/value-graph-node.component';
import {
	CurveRange,
	GraphNodeKind,
	ValueGraphEdgeState,
	ValueGraphNodeData,
	ValueGraphNodeState,
	ValueGraphState
} from '../ui/value-graph.models';

export function createGraphNodeState(
	kind: GraphNodeKind,
	index: number
): ValueGraphNodeState {
	const id = `${kind}-${crypto.randomUUID()}`;
	const x = kind === 'result' ? 780 : kind === 'curve' ? 540 : 120 + (index % 2) * 160;
	const y = 48 + index * 72;

	switch (kind) {
		case 'characterInput':
			return { id, kind, x, y };
		case 'source':
			return { id, kind, x, y, sourceValueId: null };
		case 'constant':
			return { id, kind, x, y, constantValue: 0 };
		case 'operation':
			return { id, kind, x, y, operation: 'sum' };
		case 'curve':
			return {
				id,
				kind,
				x,
				y,
				curveRanges: [{ id: crypto.randomUUID(), from: 0, to: 0, result: 0 }]
			};
		case 'result':
			return { id, kind, x, y };
	}
}

export function createRuntimeGraphNode(
	node: ValueGraphNodeState,
	sourceValueName: string | null
): ComponentNode<ValueGraphNodeData> {
	return {
		id: node.id,
		point: signal({ x: node.x, y: node.y }),
		type: ValueGraphNodeComponent,
		data: signal({
			kind: node.kind,
			sourceValueId: node.sourceValueId ?? null,
			sourceValueName,
			constantValue: node.constantValue,
			operation: node.operation,
			curveRanges: structuredClone(node.curveRanges ?? [])
		})
	};
}

export function serializeGraphNode(
	node: ComponentNode<ValueGraphNodeData>
): ValueGraphNodeState {
	const data = node.data?.();

	return {
		id: node.id,
		kind: data?.kind ?? 'constant',
		x: node.point().x,
		y: node.point().y,
		sourceValueId: data?.sourceValueId ?? null,
		constantValue: data?.constantValue,
		operation: data?.operation,
		curveRanges: structuredClone(data?.curveRanges ?? [])
	};
}

export function serializeGraphEdge(edge: Edge): ValueGraphEdgeState {
	return {
		id: edge.id,
		source: edge.source,
		target: edge.target,
		sourceHandle: edge.sourceHandle,
		targetHandle: edge.targetHandle
	};
}

export function normalizeGraphState(
	graph: ValueGraphState | null | undefined
): ValueGraphState | null {
	if (!graph) {
		return null;
	}

	const nodes = graph.nodes.map(normalizeGraphNodeState);
	const edges = graph.edges.map(normalizeGraphEdgeState);

	if (!nodes.length && !edges.length) {
		return null;
	}

	return { nodes, edges };
}

function normalizeGraphNodeState(node: ValueGraphNodeState): ValueGraphNodeState {
	const normalized: ValueGraphNodeState = {
		id: node.id,
		kind: node.kind,
		x: node.x,
		y: node.y
	};

	if (node.kind === 'source' && node.sourceValueId) {
		normalized.sourceValueId = node.sourceValueId;
	}

	if (node.kind === 'constant' && node.constantValue !== undefined) {
		normalized.constantValue = node.constantValue;
	}

	if (node.kind === 'operation' && node.operation) {
		normalized.operation = node.operation;
	}

	if (node.kind === 'curve' && node.curveRanges?.length) {
		normalized.curveRanges = structuredClone(node.curveRanges);
	}

	return normalized;
}

function normalizeGraphEdgeState(edge: ValueGraphEdgeState): ValueGraphEdgeState {
	return {
		id: edge.id,
		source: edge.source,
		target: edge.target,
		...(edge.sourceHandle ? { sourceHandle: edge.sourceHandle } : {}),
		...(edge.targetHandle ? { targetHandle: edge.targetHandle } : {})
	};
}

export function cloneCurveRanges(curveRanges: CurveRange[] | undefined) {
	return structuredClone(curveRanges ?? []);
}
