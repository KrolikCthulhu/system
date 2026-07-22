import { SystemValue } from './values.models';
import {
	CurveRange,
	GraphComparison,
	GraphOperation,
	ValueGraphState
} from '../ui/value-graph.models';

export const CHARACTER_INPUT_OVERRIDE_KEY = '__characterInput';

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
		sourceOverrides,
		new Set<string>()
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
	if (!value.calculationGraph) {
		return 0;
	}

	return evaluateGraph(value.calculationGraph, values, {
		[CHARACTER_INPUT_OVERRIDE_KEY]: value.baseValue
	}).finalBase;
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

export function comparisonLabel(comparison: GraphComparison): string {
	switch (comparison) {
		case 'eq':
			return 'Равно';
		case 'ne':
			return 'Не равно';
		case 'gt':
			return 'Больше';
		case 'gte':
			return 'Больше или равно';
		case 'lt':
			return 'Меньше';
		case 'lte':
			return 'Меньше или равно';
	}
}

export function comparisonSymbol(comparison: GraphComparison): string {
	switch (comparison) {
		case 'eq':
			return '=';
		case 'ne':
			return '!=';
		case 'gt':
			return '>';
		case 'gte':
			return '>=';
		case 'lt':
			return '<';
		case 'lte':
			return '<=';
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
		sourceOverrides,
		new Set<string>()
	);
}

function evaluateGraphNode(
	nodeId: string,
	graph: ValueGraphState,
	values: SystemValue[],
	breakdown: string[],
	visited: Set<string>,
	sourceOverrides?: Record<string, number>,
	visitedValues: Set<string> = new Set<string>()
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
		case 'characterInput':
			result = sourceOverrides?.[CHARACTER_INPUT_OVERRIDE_KEY] ?? 0;
			breakdown.push(`Ввод персонажа = ${formatNumber(result)}`);
			break;
		case 'source': {
			const referencedValue = node.sourceValueId
				? (values.find(value => value.id === node.sourceValueId) ?? null)
				: null;
			result = referencedValue
				? evaluateSystemValue(
						referencedValue,
						values,
						sourceOverrides,
						visitedValues
					)
				: 0;
			breakdown.push(
				`Значение системы ${referencedValue?.name ?? node.sourceValueId ?? 'не выбрано'} = ${formatNumber(result)}`
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
							const edge = incomingEdges.find(
								item => item.targetHandle === handleId
							);
							return edge
								? evaluateGraphNode(
										edge.source,
										graph,
										values,
										breakdown,
										visited,
										sourceOverrides,
										visitedValues
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
								sourceOverrides,
								visitedValues
							)
						);

			result = applyOperation(node.operation ?? 'sum', incomingValues);
			breakdown.push(
				`${operationLabel(node.operation ?? 'sum')} = ${formatNumber(result)}`
			);
			break;
		}
		case 'comparison': {
			const left = evaluateHandleValue(
				node.id,
				'a',
				graph,
				values,
				breakdown,
				visited,
				sourceOverrides,
				visitedValues
			);
			const right = evaluateHandleValue(
				node.id,
				'b',
				graph,
				values,
				breakdown,
				visited,
				sourceOverrides,
				visitedValues
			);
			result = applyComparison(node.comparison ?? 'gte', left, right) ? 1 : 0;
			breakdown.push(
				`Сравнение: ${formatNumber(left)} ${comparisonSymbol(node.comparison ?? 'gte')} ${formatNumber(right)} = ${formatNumber(result)}`
			);
			break;
		}
		case 'condition': {
			const condition = evaluateHandleValue(
				node.id,
				'condition',
				graph,
				values,
				breakdown,
				visited,
				sourceOverrides,
				visitedValues
			);
			const thenValue = evaluateHandleValue(
				node.id,
				'then',
				graph,
				values,
				breakdown,
				visited,
				sourceOverrides,
				visitedValues
			);
			const elseValue = evaluateHandleValue(
				node.id,
				'else',
				graph,
				values,
				breakdown,
				visited,
				sourceOverrides,
				visitedValues
			);
			result = condition !== 0 ? thenValue : elseValue;
			breakdown.push(
				`Если: ${condition !== 0 ? 'значение если да' : 'значение если нет'} = ${formatNumber(result)}`
			);
			break;
		}
		case 'curve': {
			const incoming = findIncomingEdge(node.id, graph);
			const sourceValue = incoming
				? evaluateGraphNode(
						incoming.source,
						graph,
						values,
						breakdown,
						visited,
						sourceOverrides,
						visitedValues
					)
				: 0;
			result = applyCurve(sourceValue, node.curveRanges ?? []);
			breakdown.push(`Шкала уровней = ${formatNumber(result)}`);
			break;
		}
		case 'result': {
			const incoming = findIncomingEdge(node.id, graph);
			result = incoming
				? evaluateGraphNode(
						incoming.source,
						graph,
						values,
						breakdown,
						visited,
						sourceOverrides,
						visitedValues
					)
				: 0;
			breakdown.push(`Результат = ${formatNumber(result)}`);
			break;
		}
	}

	visited.delete(nodeId);
	return result;
}

function evaluateHandleValue(
	nodeId: string,
	handleId: string,
	graph: ValueGraphState,
	values: SystemValue[],
	breakdown: string[],
	visited: Set<string>,
	sourceOverrides?: Record<string, number>,
	visitedValues: Set<string> = new Set<string>()
) {
	const incoming = graph.edges.find(
		edge => edge.target === nodeId && edge.targetHandle === handleId
	);

	return incoming
		? evaluateGraphNode(
				incoming.source,
				graph,
				values,
				breakdown,
				visited,
				sourceOverrides,
				visitedValues
			)
		: 0;
}

function evaluateSystemValue(
	value: SystemValue,
	values: SystemValue[],
	sourceOverrides?: Record<string, number>,
	visitedValues: Set<string> = new Set<string>()
) {
	if (visitedValues.has(value.id)) {
		return 0;
	}

	if (!value.calculationGraph) {
		return sourceOverrides?.[value.id] ?? value.baseValue;
	}

	visitedValues.add(value.id);
	const resultNode = value.calculationGraph.nodes.find(
		node => node.kind === 'result'
	);
	const result = resultNode
		? evaluateGraphNode(
				resultNode.id,
				value.calculationGraph,
				values,
				[],
				new Set<string>(),
				{
					...sourceOverrides,
					[CHARACTER_INPUT_OVERRIDE_KEY]:
						sourceOverrides?.[value.id] ?? value.baseValue
				},
				visitedValues
			)
		: (sourceOverrides?.[value.id] ?? value.baseValue);
	visitedValues.delete(value.id);

	return result;
}

function findIncomingNode(nodeId: string, graph: ValueGraphState) {
	const incoming = graph.edges.find(edge => edge.target === nodeId);
	return incoming
		? (graph.nodes.find(node => node.id === incoming.source) ?? null)
		: null;
}

function findIncomingEdge(nodeId: string, graph: ValueGraphState) {
	return graph.edges.find(edge => edge.target === nodeId) ?? null;
}

function applyCurve(value: number, ranges: CurveRange[]): number {
	const matchingRange = ranges.find(
		range => value >= range.from && value <= range.to
	);
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

function applyComparison(
	comparison: GraphComparison,
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
