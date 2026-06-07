import {
	MechanicCalculationComparison,
	MechanicCalculationGraphState,
	MechanicCalculationNodeKind,
	MechanicCalculationOperation
} from './mechanic-calculation-graph.models';

export function formatMechanicCalculationFormula(
	graph: MechanicCalculationGraphState | null | undefined,
	sourceNames: ReadonlyMap<string, string>
) {
	if (!graph?.nodes.length) {
		return 'Формула не задана';
	}

	const resultNode = graph.nodes.find(node => node.kind === 'result');

	if (!resultNode) {
		return 'В графе нет результата';
	}

	return formatIncomingFormula(resultNode.id, 'in', graph, sourceNames, new Set());
}

function formatIncomingFormula(
	nodeId: string,
	handleId: string,
	graph: MechanicCalculationGraphState,
	sourceNames: ReadonlyMap<string, string>,
	visited: Set<string>
) {
	const edge = graph.edges.find(
		item =>
			item.target === nodeId &&
			(item.targetHandle ?? 'in') === handleId
	);

	if (!edge) {
		return '0';
	}

	return formatNodeFormula(edge.source, graph, sourceNames, visited);
}

function formatNodeFormula(
	nodeId: string,
	graph: MechanicCalculationGraphState,
	sourceNames: ReadonlyMap<string, string>,
	visited: Set<string>
): string {
	if (visited.has(nodeId)) {
		return 'цикл';
	}

	const node = graph.nodes.find(item => item.id === nodeId);

	if (!node) {
		return '0';
	}

	visited.add(nodeId);

	const formula = formatKnownNodeFormula(
		node.kind,
		nodeId,
		graph,
		sourceNames,
		visited,
		node.sourceId,
		node.constantValue,
		node.operation,
		node.comparison
	);

	visited.delete(nodeId);
	return formula;
}

function formatKnownNodeFormula(
	kind: MechanicCalculationNodeKind,
	nodeId: string,
	graph: MechanicCalculationGraphState,
	sourceNames: ReadonlyMap<string, string>,
	visited: Set<string>,
	sourceId?: string | null,
	constantValue?: number,
	operation?: MechanicCalculationOperation,
	comparison?: MechanicCalculationComparison
) {
	switch (kind) {
		case 'source':
			return sourceId ? (sourceNames.get(sourceId) ?? 'Источник') : 'Источник';
		case 'constant':
			return String(constantValue ?? 0);
		case 'operation':
			return formatOperationFormula(
				nodeId,
				operation ?? 'sum',
				graph,
				sourceNames,
				visited
			);
		case 'comparison': {
			const left = formatIncomingFormula(
				nodeId,
				'a',
				graph,
				sourceNames,
				visited
			);
			const right = formatIncomingFormula(
				nodeId,
				'b',
				graph,
				sourceNames,
				visited
			);
			return `(${left} ${comparisonSymbol(comparison ?? 'gte')} ${right})`;
		}
		case 'condition': {
			const condition = formatIncomingFormula(
				nodeId,
				'condition',
				graph,
				sourceNames,
				visited
			);
			const thenValue = formatIncomingFormula(
				nodeId,
				'then',
				graph,
				sourceNames,
				visited
			);
			const elseValue = formatIncomingFormula(
				nodeId,
				'else',
				graph,
				sourceNames,
				visited
			);
			return `если ${condition}, то ${thenValue}, иначе ${elseValue}`;
		}
		case 'result':
			return formatIncomingFormula(nodeId, 'in', graph, sourceNames, visited);
	}
}

function formatOperationFormula(
	nodeId: string,
	operation: MechanicCalculationOperation,
	graph: MechanicCalculationGraphState,
	sourceNames: ReadonlyMap<string, string>,
	visited: Set<string>
) {
	if (operation === 'subtract' || operation === 'divide' || operation === 'power') {
		const left = formatIncomingFormula(nodeId, 'a', graph, sourceNames, visited);
		const right = formatIncomingFormula(nodeId, 'b', graph, sourceNames, visited);
		return `(${left} ${operationSymbol(operation)} ${right})`;
	}

	if (isUnaryOperation(operation)) {
		const value = formatIncomingFormula(nodeId, 'in', graph, sourceNames, visited);
		return `${operationLabel(operation)}(${value})`;
	}

	const values = graph.edges
		.filter(edge => edge.target === nodeId)
		.map(edge => formatNodeFormula(edge.source, graph, sourceNames, visited));

	if (!values.length) {
		return '0';
	}

	if (operation === 'sum' || operation === 'multiply') {
		return `(${values.join(` ${operationSymbol(operation)} `)})`;
	}

	return `${operationLabel(operation)}(${values.join(', ')})`;
}

function operationSymbol(operation: MechanicCalculationOperation) {
	switch (operation) {
		case 'sum':
			return '+';
		case 'multiply':
			return '*';
		case 'subtract':
			return '-';
		case 'divide':
			return '/';
		case 'power':
			return '^';
		case 'average':
		case 'min':
		case 'max':
		case 'sqrt':
		case 'log':
		case 'exp':
		case 'floor':
		case 'round':
		case 'ceil':
			return '';
	}
}

function operationLabel(operation: MechanicCalculationOperation) {
	switch (operation) {
		case 'average':
			return 'среднее';
		case 'min':
			return 'мин';
		case 'max':
			return 'макс';
		case 'sum':
			return 'сумма';
		case 'multiply':
			return 'произведение';
		case 'subtract':
			return 'разность';
		case 'divide':
			return 'деление';
		case 'power':
			return 'степень';
		case 'sqrt':
			return 'sqrt';
		case 'log':
			return 'log';
		case 'exp':
			return 'exp';
		case 'floor':
			return 'floor';
		case 'round':
			return 'round';
		case 'ceil':
			return 'ceil';
	}
}

function isUnaryOperation(operation: MechanicCalculationOperation): boolean {
	return (
		operation === 'sqrt' ||
		operation === 'log' ||
		operation === 'exp' ||
		operation === 'floor' ||
		operation === 'round' ||
		operation === 'ceil'
	);
}

function comparisonSymbol(comparison: MechanicCalculationComparison) {
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
