import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/generated';

export const CHARACTER_INPUT_OVERRIDE_KEY = '__characterInput';

export interface RuntimeSystemValue {
	id: string;
	name: string;
	calculationGraph: Prisma.JsonValue | null;
}

type ValueGraphOperation =
	| 'sum'
	| 'average'
	| 'min'
	| 'max'
	| 'multiply'
	| 'subtract'
	| 'divide';
type ValueGraphComparison = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';

interface ValueGraphNode {
	id: string;
	kind: string;
	sourceValueId?: string | null;
	constantValue?: number;
	operation?: ValueGraphOperation;
	comparison?: ValueGraphComparison;
	curveRanges?: Array<{
		id?: string;
		from: number;
		to: number;
		result: number;
	}>;
}

interface ValueGraphEdge {
	id?: string;
	source: string;
	target: string;
	sourceHandle?: string;
	targetHandle?: string;
}

interface ValueGraph {
	nodes: ValueGraphNode[];
	edges: ValueGraphEdge[];
}

@Injectable()
export class SystemValueRuntimeService {
	evaluateValue(
		valueId: string,
		values: RuntimeSystemValue[],
		inputValues: Record<string, number>
	): number {
		const valuesById = new Map(values.map(value => [value.id, value]));
		return this.evaluateSystemValue(valueId, valuesById, inputValues, new Set());
	}

	private evaluateSystemValue(
		valueId: string,
		valuesById: Map<string, RuntimeSystemValue>,
		inputValues: Record<string, number>,
		visitedValues: Set<string>
	): number {
		if (visitedValues.has(valueId)) {
			return 0;
		}

		const value = valuesById.get(valueId);

		if (!value) {
			return inputValues[valueId] ?? 0;
		}

		const graph = parseValueGraph(value.calculationGraph);

		if (!graph) {
			return inputValues[valueId] ?? 0;
		}

		visitedValues.add(valueId);
		const resultNode = graph.nodes.find(node => node.kind === 'result');
		const result = resultNode
			? this.evaluateGraphNode(resultNode.id, graph, valuesById, inputValues, {
					rootValueId: valueId,
					visitedNodes: new Set(),
					visitedValues
			  })
			: inputValues[valueId] ?? 0;
		visitedValues.delete(valueId);

		return result;
	}

	private evaluateGraphNode(
		nodeId: string,
		graph: ValueGraph,
		valuesById: Map<string, RuntimeSystemValue>,
		inputValues: Record<string, number>,
		context: {
			rootValueId: string;
			visitedNodes: Set<string>;
			visitedValues: Set<string>;
		}
	): number {
		if (context.visitedNodes.has(nodeId)) {
			return 0;
		}

		const node = graph.nodes.find(item => item.id === nodeId);

		if (!node) {
			return 0;
		}

		context.visitedNodes.add(nodeId);

		const result = this.evaluateKnownGraphNode(
			node,
			graph,
			valuesById,
			inputValues,
			context
		);

		context.visitedNodes.delete(nodeId);
		return result;
	}

	private evaluateKnownGraphNode(
		node: ValueGraphNode,
		graph: ValueGraph,
		valuesById: Map<string, RuntimeSystemValue>,
		inputValues: Record<string, number>,
		context: {
			rootValueId: string;
			visitedNodes: Set<string>;
			visitedValues: Set<string>;
		}
	): number {
		switch (node.kind) {
			case 'characterInput':
				return inputValues[context.rootValueId] ?? 0;
			case 'source':
				return node.sourceValueId
					? this.evaluateSystemValue(
							node.sourceValueId,
							valuesById,
							inputValues,
							context.visitedValues
					  )
					: 0;
			case 'constant':
				return node.constantValue ?? 0;
			case 'operation':
				return applyOperation(
					node.operation ?? 'sum',
					this.resolveOperationInputs(node, graph, valuesById, inputValues, context)
				);
			case 'comparison': {
				const left = this.evaluateHandleValue(
					node.id,
					'a',
					graph,
					valuesById,
					inputValues,
					context
				);
				const right = this.evaluateHandleValue(
					node.id,
					'b',
					graph,
					valuesById,
					inputValues,
					context
				);
				return applyComparison(node.comparison ?? 'gte', left, right) ? 1 : 0;
			}
			case 'condition': {
				const condition = this.evaluateHandleValue(
					node.id,
					'condition',
					graph,
					valuesById,
					inputValues,
					context
				);
				return condition !== 0
					? this.evaluateHandleValue(
							node.id,
							'then',
							graph,
							valuesById,
							inputValues,
							context
					  )
					: this.evaluateHandleValue(
							node.id,
							'else',
							graph,
							valuesById,
							inputValues,
							context
					  );
			}
			case 'curve': {
				const incoming = graph.edges.find(edge => edge.target === node.id);
				const sourceValue = incoming
					? this.evaluateGraphNode(
							incoming.source,
							graph,
							valuesById,
							inputValues,
							context
					  )
					: 0;
				return applyCurve(sourceValue, node.curveRanges ?? []);
			}
			case 'result': {
				const incoming = graph.edges.find(edge => edge.target === node.id);
				return incoming
					? this.evaluateGraphNode(
							incoming.source,
							graph,
							valuesById,
							inputValues,
							context
					  )
					: 0;
			}
			default:
				return 0;
		}
	}

	private resolveOperationInputs(
		node: ValueGraphNode,
		graph: ValueGraph,
		valuesById: Map<string, RuntimeSystemValue>,
		inputValues: Record<string, number>,
		context: {
			rootValueId: string;
			visitedNodes: Set<string>;
			visitedValues: Set<string>;
		}
	) {
		const incomingEdges = graph.edges.filter(edge => edge.target === node.id);

		if (node.operation === 'subtract' || node.operation === 'divide') {
			return ['a', 'b'].map(handleId =>
				this.evaluateHandleValue(
					node.id,
					handleId,
					graph,
					valuesById,
					inputValues,
					context
				)
			);
		}

		return incomingEdges.map(edge =>
			this.evaluateGraphNode(
				edge.source,
				graph,
				valuesById,
				inputValues,
				context
			)
		);
	}

	private evaluateHandleValue(
		nodeId: string,
		handleId: string,
		graph: ValueGraph,
		valuesById: Map<string, RuntimeSystemValue>,
		inputValues: Record<string, number>,
		context: {
			rootValueId: string;
			visitedNodes: Set<string>;
			visitedValues: Set<string>;
		}
	) {
		const incoming = graph.edges.find(
			edge => edge.target === nodeId && edge.targetHandle === handleId
		);

		return incoming
			? this.evaluateGraphNode(
					incoming.source,
					graph,
					valuesById,
					inputValues,
					context
			  )
			: 0;
	}
}

function parseValueGraph(value: Prisma.JsonValue | null): ValueGraph | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null;
	}

	const nodes = readArray(value, 'nodes')
		.map(parseValueGraphNode)
		.filter((node): node is ValueGraphNode => node !== null);
	const edges = readArray(value, 'edges')
		.map(parseValueGraphEdge)
		.filter((edge): edge is ValueGraphEdge => edge !== null);

	return { nodes, edges };
}

function parseValueGraphNode(value: unknown): ValueGraphNode | null {
	if (!isRecord(value) || typeof value.id !== 'string' || typeof value.kind !== 'string') {
		return null;
	}

	return {
		id: value.id,
		kind: value.kind,
		sourceValueId:
			typeof value.sourceValueId === 'string' ? value.sourceValueId : null,
		constantValue:
			typeof value.constantValue === 'number' ? value.constantValue : undefined,
		operation: parseOperation(value.operation),
		comparison: parseComparison(value.comparison),
		curveRanges: readArray(value, 'curveRanges')
			.map(parseCurveRange)
			.filter((range): range is { from: number; to: number; result: number } => range !== null)
	};
}

function parseValueGraphEdge(value: unknown): ValueGraphEdge | null {
	if (
		!isRecord(value) ||
		typeof value.source !== 'string' ||
		typeof value.target !== 'string'
	) {
		return null;
	}

	return {
		id: typeof value.id === 'string' ? value.id : undefined,
		source: value.source,
		target: value.target,
		sourceHandle:
			typeof value.sourceHandle === 'string' ? value.sourceHandle : undefined,
		targetHandle:
			typeof value.targetHandle === 'string' ? value.targetHandle : undefined
	};
}

function parseCurveRange(value: unknown) {
	if (
		!isRecord(value) ||
		typeof value.from !== 'number' ||
		typeof value.to !== 'number' ||
		typeof value.result !== 'number'
	) {
		return null;
	}

	return {
		from: value.from,
		to: value.to,
		result: value.result
	};
}

function readArray(record: object, key: string): unknown[] {
	const value = (record as Record<string, unknown>)[key];
	return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseOperation(value: unknown): ValueGraphOperation | undefined {
	return value === 'sum' ||
		value === 'average' ||
		value === 'min' ||
		value === 'max' ||
		value === 'multiply' ||
		value === 'subtract' ||
		value === 'divide'
		? value
		: undefined;
}

function parseComparison(value: unknown): ValueGraphComparison | undefined {
	return value === 'eq' ||
		value === 'ne' ||
		value === 'gt' ||
		value === 'gte' ||
		value === 'lt' ||
		value === 'lte'
		? value
		: undefined;
}

function applyCurve(
	value: number,
	ranges: Array<{ from: number; to: number; result: number }>
) {
	return ranges.find(range => value >= range.from && value <= range.to)?.result ?? 0;
}

function applyOperation(operation: ValueGraphOperation, values: number[]): number {
	if (!values.length) {
		return 0;
	}

	switch (operation) {
		case 'sum':
			return values.reduce((total, value) => total + value, 0);
		case 'average':
			return values.reduce((total, value) => total + value, 0) / values.length;
		case 'min':
			return Math.min(...values);
		case 'max':
			return Math.max(...values);
		case 'multiply':
			return values.reduce((total, value) => total * value, 1);
		case 'subtract':
			return (values[0] ?? 0) - (values[1] ?? 0);
		case 'divide':
			return values[1] ? (values[0] ?? 0) / values[1] : 0;
	}
}

function applyComparison(
	comparison: ValueGraphComparison,
	left: number,
	right: number
): boolean {
	switch (comparison) {
		case 'eq':
			return left === right;
		case 'ne':
			return left !== right;
		case 'gt':
			return left > right;
		case 'gte':
			return left >= right;
		case 'lt':
			return left < right;
		case 'lte':
			return left <= right;
	}
}
