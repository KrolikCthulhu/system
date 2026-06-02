import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import {
	RuntimeSystemValue,
	SystemValueRuntimeService
} from './system-value-runtime.service';

type RollEventInputKey =
	| 'diceCount'
	| 'successes'
	| 'ones'
	| 'ignoredOnes'
	| 'consequenceCount'
	| 'skillLevel';
type RollEventGraphOperation =
	| 'sum'
	| 'min'
	| 'max'
	| 'multiply'
	| 'subtract'
	| 'divide';
type RollEventGraphComparison = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';
type RollEventThresholdSource = 'base' | 'final';
type RollEventThresholdResetMode = 'zero' | 'subtractThreshold';

export interface RollEventPayload {
	diceCount: number;
	successes: number;
	ones: number;
	ignoredOnes: number;
	consequenceCount: number;
	skillLevel: number;
}

export interface EventValueChange {
	valueId: string;
	value: number;
}

export interface RollEventGraphExecutionResult {
	valueChanges: EventValueChange[];
	logs: string[];
}

interface RollEventGraphNode {
	id: string;
	kind: string;
	eventInputKey?: RollEventInputKey;
	sourceValueId?: string | null;
	targetValueId?: string | null;
	accumulatorValueId?: string | null;
	overflowValueId?: string | null;
	thresholdValueId?: string | null;
	thresholdSource?: RollEventThresholdSource;
	resetMode?: RollEventThresholdResetMode;
	overflowIncrement?: number;
	constantValue?: number;
	operation?: RollEventGraphOperation;
	comparison?: RollEventGraphComparison;
}

interface RollEventGraphEdge {
	id?: string;
	source: string;
	target: string;
	sourceHandle?: string;
	targetHandle?: string;
}

interface RollEventGraph {
	nodes: RollEventGraphNode[];
	edges: RollEventGraphEdge[];
}

@Injectable()
export class RollEventGraphRuntimeService {
	constructor(private readonly systemValueRuntime: SystemValueRuntimeService) {}

	execute(params: {
		graph: Prisma.JsonValue | null;
		payload: RollEventPayload;
		values: RuntimeSystemValue[];
		inputValues: Record<string, number>;
		handlerName: string;
	}): RollEventGraphExecutionResult {
		const graph = parseRollEventGraph(params.graph);

		if (!graph) {
			return { valueChanges: [], logs: [] };
		}

		const actionNodes = graph.nodes.filter(
			node => node.kind === 'writeValue' || node.kind === 'thresholdCounter'
		);
		const logs: string[] = [];
		const valueChanges = actionNodes
			.map(node => {
				if (node.kind === 'thresholdCounter') {
					return this.executeThresholdCounterNode(node, graph, params, logs);
				}

				if (!node.targetValueId) {
					logs.push(`${params.handlerName}: пропущена запись без значения.`);
					return null;
				}

				const incoming = graph.edges.find(
					edge => edge.target === node.id && edge.targetHandle === 'value'
				);

				if (!incoming) {
					logs.push(`${params.handlerName}: пропущена запись без входа.`);
					return null;
				}

				const value = this.evaluateNode(incoming.source, graph, params, new Set());
				logs.push(
					`${params.handlerName}: значение ${node.targetValueId} = ${formatNumber(value)}.`
				);
				return {
					valueId: node.targetValueId,
					value
				};
			})
			.flat()
			.filter((change): change is EventValueChange => change !== null);

		return { valueChanges, logs };
	}

	private executeThresholdCounterNode(
		node: RollEventGraphNode,
		graph: RollEventGraph,
		params: {
			payload: RollEventPayload;
			values: RuntimeSystemValue[];
			inputValues: Record<string, number>;
			handlerName: string;
		},
		logs: string[]
	): EventValueChange[] | null {
		const accumulatorValueId = node.accumulatorValueId;
		const thresholdValueId = node.thresholdValueId;
		const overflowValueId = node.overflowValueId;

		if (!accumulatorValueId || !thresholdValueId || !overflowValueId) {
			logs.push(
				`${params.handlerName}: пропущен накопитель с порогом без выбранных значений.`
			);
			return null;
		}

		const incrementInput = graph.edges.find(
			edge => edge.target === node.id && edge.targetHandle === 'increment'
		);
		const increment = incrementInput
			? this.evaluateNode(incrementInput.source, graph, params, new Set())
			: params.payload.consequenceCount;
		const currentCounter = this.systemValueRuntime.evaluateValue(
			accumulatorValueId,
			params.values,
			params.inputValues
		);
		const currentOverflowValue = this.systemValueRuntime.evaluateValue(
			overflowValueId,
			params.values,
			params.inputValues
		);
		const threshold =
			node.thresholdSource === 'final'
				? this.systemValueRuntime.evaluateValue(
						thresholdValueId,
						params.values,
						params.inputValues
				  )
				: (params.inputValues[thresholdValueId] ?? 0);
		const nextCounter = currentCounter + increment;
		const overflow = threshold > 0 && nextCounter >= threshold;
		const accumulatorValue = overflow
			? applyResetMode(node.resetMode ?? 'zero', nextCounter, threshold)
			: nextCounter;
		const overflowValue = overflow
			? currentOverflowValue + (node.overflowIncrement ?? 1)
			: currentOverflowValue;

		logs.push(
			`${params.handlerName}: накопитель ${accumulatorValueId} + ${formatNumber(increment)}, порог ${formatNumber(threshold)}, ${overflow ? 'переполнение' : 'без переполнения'}.`
		);

		return [
			{ valueId: accumulatorValueId, value: accumulatorValue },
			{ valueId: overflowValueId, value: overflowValue }
		];
	}

	private evaluateNode(
		nodeId: string,
		graph: RollEventGraph,
		params: {
			payload: RollEventPayload;
			values: RuntimeSystemValue[];
			inputValues: Record<string, number>;
		},
		visited: Set<string>
	): number {
		if (visited.has(nodeId)) {
			return 0;
		}

		const node = graph.nodes.find(item => item.id === nodeId);

		if (!node) {
			return 0;
		}

		visited.add(nodeId);
		const result = this.evaluateKnownNode(node, graph, params, visited);
		visited.delete(nodeId);

		return result;
	}

	private evaluateKnownNode(
		node: RollEventGraphNode,
		graph: RollEventGraph,
		params: {
			payload: RollEventPayload;
			values: RuntimeSystemValue[];
			inputValues: Record<string, number>;
		},
		visited: Set<string>
	): number {
		switch (node.kind) {
			case 'eventInput':
				return params.payload[node.eventInputKey ?? 'consequenceCount'];
			case 'valueSource':
				return node.sourceValueId
					? this.systemValueRuntime.evaluateValue(
							node.sourceValueId,
							params.values,
							params.inputValues
					  )
					: 0;
			case 'constant':
				return node.constantValue ?? 0;
			case 'operation':
				return applyOperation(
					node.operation ?? 'sum',
					this.resolveOperationInputs(node, graph, params, visited)
				);
			case 'comparison': {
				const left = this.evaluateHandleValue(
					node.id,
					'a',
					graph,
					params,
					visited
				);
				const right = this.evaluateHandleValue(
					node.id,
					'b',
					graph,
					params,
					visited
				);
				return applyComparison(node.comparison ?? 'gte', left, right) ? 1 : 0;
			}
			case 'condition': {
				const condition = this.evaluateHandleValue(
					node.id,
					'condition',
					graph,
					params,
					visited
				);
				return condition !== 0
					? this.evaluateHandleValue(node.id, 'then', graph, params, visited)
					: this.evaluateHandleValue(node.id, 'else', graph, params, visited);
			}
			default:
				return 0;
		}
	}

	private resolveOperationInputs(
		node: RollEventGraphNode,
		graph: RollEventGraph,
		params: {
			payload: RollEventPayload;
			values: RuntimeSystemValue[];
			inputValues: Record<string, number>;
		},
		visited: Set<string>
	) {
		const incomingEdges = graph.edges.filter(edge => edge.target === node.id);

		if (node.operation === 'subtract' || node.operation === 'divide') {
			return ['a', 'b'].map(handleId =>
				this.evaluateHandleValue(node.id, handleId, graph, params, visited)
			);
		}

		return incomingEdges.map(edge =>
			this.evaluateNode(edge.source, graph, params, visited)
		);
	}

	private evaluateHandleValue(
		nodeId: string,
		handleId: string,
		graph: RollEventGraph,
		params: {
			payload: RollEventPayload;
			values: RuntimeSystemValue[];
			inputValues: Record<string, number>;
		},
		visited: Set<string>
	) {
		const incoming = graph.edges.find(
			edge => edge.target === nodeId && edge.targetHandle === handleId
		);

		return incoming
			? this.evaluateNode(incoming.source, graph, params, visited)
			: 0;
	}
}

function parseRollEventGraph(value: Prisma.JsonValue | null): RollEventGraph | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return null;
	}

	const nodes = readArray(value, 'nodes')
		.map(parseRollEventGraphNode)
		.filter((node): node is RollEventGraphNode => node !== null);
	const edges = readArray(value, 'edges')
		.map(parseRollEventGraphEdge)
		.filter((edge): edge is RollEventGraphEdge => edge !== null);

	if (!nodes.length) {
		return null;
	}

	return { nodes, edges };
}

function parseRollEventGraphNode(value: unknown): RollEventGraphNode | null {
	if (!isRecord(value) || typeof value.id !== 'string' || typeof value.kind !== 'string') {
		return null;
	}

	return {
		id: value.id,
		kind: value.kind,
		eventInputKey: parseEventInputKey(value.eventInputKey),
		sourceValueId:
			typeof value.sourceValueId === 'string' ? value.sourceValueId : null,
		targetValueId:
			typeof value.targetValueId === 'string' ? value.targetValueId : null,
		accumulatorValueId:
			typeof value.accumulatorValueId === 'string'
				? value.accumulatorValueId
				: null,
		overflowValueId:
			typeof value.overflowValueId === 'string' ? value.overflowValueId : null,
		thresholdValueId:
			typeof value.thresholdValueId === 'string' ? value.thresholdValueId : null,
		thresholdSource: parseThresholdSource(value.thresholdSource),
		resetMode: parseResetMode(value.resetMode),
		overflowIncrement:
			typeof value.overflowIncrement === 'number'
				? value.overflowIncrement
				: undefined,
		constantValue:
			typeof value.constantValue === 'number' ? value.constantValue : undefined,
		operation: parseOperation(value.operation),
		comparison: parseComparison(value.comparison)
	};
}

function parseRollEventGraphEdge(value: unknown): RollEventGraphEdge | null {
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

function readArray(record: object, key: string): unknown[] {
	const value = (record as Record<string, unknown>)[key];
	return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseEventInputKey(value: unknown): RollEventInputKey | undefined {
	return value === 'diceCount' ||
		value === 'successes' ||
		value === 'ones' ||
		value === 'ignoredOnes' ||
		value === 'consequenceCount' ||
		value === 'skillLevel'
		? value
		: undefined;
}

function parseOperation(value: unknown): RollEventGraphOperation | undefined {
	return value === 'sum' ||
		value === 'min' ||
		value === 'max' ||
		value === 'multiply' ||
		value === 'subtract' ||
		value === 'divide'
		? value
		: undefined;
}

function parseComparison(value: unknown): RollEventGraphComparison | undefined {
	return value === 'eq' ||
		value === 'ne' ||
		value === 'gt' ||
		value === 'gte' ||
		value === 'lt' ||
		value === 'lte'
		? value
		: undefined;
}

function parseThresholdSource(value: unknown): RollEventThresholdSource | undefined {
	return value === 'base' || value === 'final' ? value : undefined;
}

function parseResetMode(value: unknown): RollEventThresholdResetMode | undefined {
	return value === 'zero' || value === 'subtractThreshold' ? value : undefined;
}

function applyResetMode(
	mode: RollEventThresholdResetMode,
	nextCounter: number,
	threshold: number
) {
	switch (mode) {
		case 'zero':
			return 0;
		case 'subtractThreshold':
			return Math.max(0, nextCounter - threshold);
	}
}

function applyOperation(
	operation: RollEventGraphOperation,
	values: number[]
): number {
	if (!values.length) {
		return 0;
	}

	switch (operation) {
		case 'sum':
			return values.reduce((total, value) => total + value, 0);
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
	comparison: RollEventGraphComparison,
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

function formatNumber(value: number): string {
	return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
