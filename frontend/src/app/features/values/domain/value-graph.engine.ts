import { SystemValue } from './values.models';
import {
	CurveRange,
	GraphOperation,
	ValueGraphState
} from '../ui/value-graph.models';

export interface GraphEvaluationResult {
	rawBase: number;
	calculatedBase: number;
	finalBase: number;
	breakdown: string[];
}

export function evaluateGraph(
	graph: ValueGraphState,
	values: SystemValue[],
	sourceOverrides?: Record<string, number>
): GraphEvaluationResult {
	const resultNode = graph.nodes.find(node => node.kind === 'result');
	const breakdown: string[] = [];

	if (!resultNode) {
		return {
			rawBase: 0,
			calculatedBase: 0,
			finalBase: 0,
			breakdown: ['В графе нет узла результата']
		};
	}

	const beforeResultNode = findIncomingNode(resultNode.id, graph);
	const finalBase = evaluateGraphNode(
		resultNode.id,
		graph,
		values,
		breakdown,
		new Set<string>(),
		sourceOverrides
	);
	const rawBase =
		beforeResultNode?.kind === 'curve'
			? evaluateIncomingValue(
					beforeResultNode.id,
					graph,
					values,
					sourceOverrides
			  )
			: finalBase;

	return {
		rawBase,
		calculatedBase: finalBase,
		finalBase,
		breakdown
	};
}

export function resolveStoredFinalValue(
	value: SystemValue,
	values: SystemValue[]
): number {
	if (value.baseSourceType !== 'computed') {
		return value.baseValue;
	}

	if (!value.calculationGraph) {
		return 0;
	}

	return evaluateGraph(value.calculationGraph, values).finalBase;
}

export function formatNumber(value: number): string {
	return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function operationLabel(operation: GraphOperation): string {
	switch (operation) {
		case 'sum':
			return 'Сложить';
		case 'average':
			return 'Среднее';
		case 'min':
			return 'Минимум';
		case 'max':
			return 'Максимум';
		case 'multiply':
			return 'Умножить';
		case 'subtract':
			return 'Вычесть';
		case 'divide':
			return 'Разделить';
	}
}

function evaluateIncomingValue(
	nodeId: string,
	graph: ValueGraphState,
	values: SystemValue[],
	sourceOverrides?: Record<string, number>
) {
	const incoming = graph.edges.find(edge => edge.target === nodeId);
	if (!incoming) {
		return 0;
	}

	return evaluateGraphNode(
		incoming.source,
		graph,
		values,
		[],
		new Set<string>(),
		sourceOverrides
	);
}

function evaluateGraphNode(
	nodeId: string,
	graph: ValueGraphState,
	values: SystemValue[],
	breakdown: string[],
	visited: Set<string>,
	sourceOverrides?: Record<string, number>
): number {
	if (visited.has(nodeId)) {
		breakdown.push('Обнаружен цикл в графе');
		return 0;
	}

	visited.add(nodeId);
	const node = graph.nodes.find(item => item.id === nodeId);

	if (!node) {
		visited.delete(nodeId);
		return 0;
	}

	let result = 0;

	switch (node.kind) {
		case 'source': {
			const referencedValue = node.sourceValueId
				? values.find(value => value.id === node.sourceValueId) ?? null
				: null;
			result =
				node.sourceValueId && sourceOverrides?.[node.sourceValueId] !== undefined
					? sourceOverrides[node.sourceValueId]
					: referencedValue
						? resolveStoredFinalValue(referencedValue, values)
						: 0;
			breakdown.push(
				`Источник ${referencedValue?.name ?? node.sourceValueId ?? 'не выбран'} = ${formatNumber(result)}`
			);
			break;
		}
		case 'constant':
			result = node.constantValue ?? 0;
			breakdown.push(`Число = ${formatNumber(result)}`);
			break;
		case 'operation': {
			const incomingEdges = graph.edges.filter(edge => edge.target === node.id);
			const incomingValues =
				node.operation === 'subtract' || node.operation === 'divide'
					? ['a', 'b'].map(handleId => {
							const edge = incomingEdges.find(item => item.targetHandle === handleId);
							return edge
								? evaluateGraphNode(
										edge.source,
										graph,
										values,
										breakdown,
										visited,
										sourceOverrides
								  )
								: 0;
					  })
					: incomingEdges.map(edge =>
							evaluateGraphNode(
								edge.source,
								graph,
								values,
								breakdown,
								visited,
								sourceOverrides
							)
					  );

			result = applyOperation(node.operation ?? 'sum', incomingValues);
			breakdown.push(
				`${operationLabel(node.operation ?? 'sum')} = ${formatNumber(result)}`
			);
			break;
		}
		case 'curve': {
			const incoming = findIncomingNode(node.id, graph);
			const sourceValue = incoming
				? evaluateGraphNode(
						incoming.id,
						graph,
						values,
						breakdown,
						visited,
						sourceOverrides
				  )
				: 0;
			result = applyCurve(sourceValue, node.curveRanges ?? []);
			breakdown.push(`Шкала уровней = ${formatNumber(result)}`);
			break;
		}
		case 'result': {
			const incoming = findIncomingNode(node.id, graph);
			result = incoming
				? evaluateGraphNode(
						incoming.id,
						graph,
						values,
						breakdown,
						visited,
						sourceOverrides
				  )
				: 0;
			breakdown.push(`Результат = ${formatNumber(result)}`);
			break;
		}
	}

	visited.delete(nodeId);
	return result;
}

function findIncomingNode(nodeId: string, graph: ValueGraphState) {
	const incoming = graph.edges.find(edge => edge.target === nodeId);
	return incoming ? graph.nodes.find(node => node.id === incoming.source) ?? null : null;
}

function applyCurve(value: number, ranges: CurveRange[]): number {
	const matchingRange = ranges.find(range => value >= range.from && value <= range.to);
	return matchingRange ? matchingRange.result : 0;
}

function applyOperation(operation: GraphOperation, values: number[]): number {
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
