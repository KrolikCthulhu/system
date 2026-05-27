import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, SelectItemGroup } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Splitter } from 'primeng/splitter';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Tag } from 'primeng/tag';
import {
	Vflow,
	Connection,
	ConnectionSettings,
	ComponentNode,
	Edge
} from 'ngx-vflow';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import { getSystemValueBaseSourceLabel } from '../../../../../shared/types/system-value.models';
import {
	SystemValue,
	SystemValuesCatalog
} from '../../../domain/values.models';
import {
	VALUES_REPOSITORY,
	ValuesRepository
} from '../../../data/values-repository.port';
import { ValueGraphNodeComponent } from '../../components/value-graph-node/value-graph-node.component';
import {
	CurveRange,
	GraphNodeKind,
	GraphOperation,
	ValueGraphEdgeState,
	ValueGraphNodeData,
	ValueGraphNodeState,
	ValueGraphState
} from '../../value-graph.models';

interface ValueGroup {
	label: string;
	items: SystemValue[];
}

interface ValuePreviewViewModel {
	rawBase: number;
	calculatedBase: number;
	final: number;
	summary: string;
	breakdown: string[];
}

interface ValueTestInputViewModel {
	id: string;
	name: string;
	groupLabel: string;
	defaultValue: number;
}

interface GraphEvaluationResult {
	rawBase: number;
	calculatedBase: number;
	finalBase: number;
	breakdown: string[];
}

interface ValueSourceOption {
	label: string;
	value: string;
}

interface GraphNodeType {
	kind: GraphNodeKind;
	label: string;
}

const OPERATION_OPTIONS = [
	{ label: 'Сложить', value: 'sum' as GraphOperation },
	{ label: 'Среднее', value: 'average' as GraphOperation },
	{ label: 'Минимум', value: 'min' as GraphOperation },
	{ label: 'Максимум', value: 'max' as GraphOperation },
	{ label: 'Умножить', value: 'multiply' as GraphOperation },
	{ label: 'Вычесть', value: 'subtract' as GraphOperation },
	{ label: 'Разделить', value: 'divide' as GraphOperation }
];

const GRAPH_NODE_TYPES: GraphNodeType[] = [
	{ kind: 'source', label: 'Источник' },
	{ kind: 'constant', label: 'Число' },
	{ kind: 'operation', label: 'Операция' },
	{ kind: 'curve', label: 'Шкала уровней' },
	{ kind: 'result', label: 'Результат' }
];

@Component({
	selector: 'app-admin-values-page',
	standalone: true,
	imports: [
		CommonModule,
		Breadcrumb,
		Button,
		ConfirmDialog,
		FormsModule,
		IconField,
		InputIcon,
		InputNumber,
		InputText,
		Select,
		Splitter,
		Tab,
		TabList,
		TabPanel,
		TabPanels,
		Tabs,
		Tag,
		Vflow
	],
	templateUrl: './admin-values-page.component.html',
	styleUrl: './admin-values-page.component.scss',
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminValuesPageComponent {
	private readonly valuesRepository = inject<ValuesRepository>(VALUES_REPOSITORY);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Значения' }
	];
	protected readonly graphNodeTypes = GRAPH_NODE_TYPES;
	protected readonly operationOptions = OPERATION_OPTIONS;
	protected readonly activeTab = signal<string | number>('calculation');
	protected readonly searchQuery = signal('');
	protected readonly loading = signal(true);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly values = signal<SystemValue[]>([]);
	protected readonly selectedValueId = signal<string | null>(null);
	protected readonly draft = signal<SystemValue | null>(null);
	protected readonly graphNodes = signal<ComponentNode<ValueGraphNodeData>[]>([]);
	protected readonly graphEdges = signal<Edge[]>([]);
	protected readonly selectedGraphNodeId = signal<string | null>(null);
	protected readonly testSourceValues = signal<Record<string, number>>({});
	protected readonly graphConnectionSettings: ConnectionSettings = {
		marker: { type: 'arrow-closed' },
		validator: connection => this.isConnectionValid(connection)
	};

	protected readonly selectedValue = computed(() => {
		const selectedId = this.selectedValueId();
		return selectedId
			? this.values().find(value => value.id === selectedId) ?? null
			: null;
	});

	protected readonly currentGraphState = computed<ValueGraphState | null>(() => {
		if (this.draft()?.baseSourceType !== 'computed') {
			return null;
		}

		return normalizeGraphState({
			nodes: this.graphNodes().map(serializeGraphNode),
			edges: this.graphEdges().map(serializeGraphEdge)
		});
	});

	protected readonly hasChanges = computed(() => {
		const selected = this.selectedValue();
		const draft = this.draft();

		if (!selected || !draft || draft.baseSourceType !== 'computed') {
			return false;
		}

		return (
			JSON.stringify(normalizeGraphState(selected.calculationGraph)) !==
			JSON.stringify(this.currentGraphState())
		);
	});

	protected readonly valueGroups = computed<ValueGroup[]>(() => {
		const query = this.searchQuery().trim().toLowerCase();
		const groups = new Map<string, SystemValue[]>();

		for (const value of this.values()) {
			const haystack = `${value.name} ${value.groupLabel} ${value.contextLabel}`.toLowerCase();

			if (query && !haystack.includes(query)) {
				continue;
			}

			const items = groups.get(value.groupLabel) ?? [];
			items.push(value);
			groups.set(value.groupLabel, items);
		}

		return Array.from(groups.entries()).map(([label, items]) => ({
			label,
			items
		}));
	});

	protected readonly dependencyGroups = computed<SelectItemGroup[]>(() => {
		const currentValueId = this.draft()?.id;
		const grouped = new Map<string, ValueSourceOption[]>();

		for (const value of this.values()) {
			if (value.id === currentValueId) {
				continue;
			}

			const groupLabel = value.contextLabel
				? `${value.groupLabel} / ${value.contextLabel}`
				: value.groupLabel;
			const items = grouped.get(groupLabel) ?? [];
			items.push({
				label: value.name,
				value: value.id
			});
			grouped.set(groupLabel, items);
		}

		return Array.from(grouped.entries()).map(([label, items]) => ({
			label,
			value: label,
			items
		}));
	});

	protected readonly selectedGraphNode = computed(() => {
		const nodeId = this.selectedGraphNodeId();
		return nodeId
			? this.graphNodes().find(node => node.id === nodeId) ?? null
			: null;
	});

	protected readonly selectedGraphNodeData = computed(
		() => this.selectedGraphNode()?.data?.() ?? null
	);

	protected readonly graphHasResultNode = computed(() =>
		this.graphNodes().some(node => node.data?.()?.kind === 'result')
	);

	protected readonly testInputs = computed<ValueTestInputViewModel[]>(() => {
		const graph = this.currentGraphState();

		if (!graph) {
			return [];
		}

		const seen = new Set<string>();
		const inputs: ValueTestInputViewModel[] = [];

		for (const node of graph.nodes) {
			if (node.kind !== 'source' || !node.sourceValueId || seen.has(node.sourceValueId)) {
				continue;
			}

			seen.add(node.sourceValueId);
			const value = this.values().find(item => item.id === node.sourceValueId);

			if (!value) {
				continue;
			}

			inputs.push({
				id: value.id,
				name: value.name,
				groupLabel: value.contextLabel
					? `${value.groupLabel} / ${value.contextLabel}`
					: value.groupLabel,
				defaultValue: this.resolveStoredFinalValue(value)
			});
		}

		return inputs;
	});

	protected readonly testResult = computed(() => {
		const draft = this.draft();
		const graph = this.currentGraphState();

		if (!draft) {
			return { final: 0, breakdown: [] as string[] };
		}

		if (draft.baseSourceType !== 'computed' || !graph) {
			return {
				final: draft.baseValue,
				breakdown: [`Результат = ${formatNumber(draft.baseValue)}`]
			};
		}

		const result = this.evaluateGraph(graph, this.testSourceValues());

		return {
			final: result.finalBase,
			breakdown: result.breakdown
		};
	});

	protected readonly preview = computed<ValuePreviewViewModel>(() => {
		const draft = this.draft();

		if (!draft) {
			return {
				rawBase: 0,
				calculatedBase: 0,
				final: 0,
				summary: '',
				breakdown: []
			};
		}

		if (draft.baseSourceType !== 'computed') {
			return {
				rawBase: draft.baseValue,
				calculatedBase: draft.baseValue,
				final: draft.baseValue,
				summary:
					'База значения задаётся напрямую у персонажа или в настройках правил, без графа расчёта.',
				breakdown: [`База = ${formatNumber(draft.baseValue)}`]
			};
		}

		const graph = this.currentGraphState();
		const graphResult = graph
			? this.evaluateGraph(graph)
			: {
					rawBase: 0,
					calculatedBase: 0,
					finalBase: 0,
					breakdown: ['Граф расчёта не задан']
				};

		return {
			rawBase: graphResult.rawBase,
			calculatedBase: graphResult.calculatedBase,
			final: graphResult.finalBase,
			summary:
				'Система проходит по графу слева направо, считает промежуточные узлы и подаёт итог в финальный результат.',
			breakdown: graphResult.breakdown
		};
	});

	constructor() {
		this.loadValues();
	}

	protected setSearchQuery(query: string) {
		this.searchQuery.set(query);
	}

	protected selectValue(valueId: string) {
		if (valueId === this.selectedValueId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => this.selectValueInternal(valueId)
		});
	}

	protected setActiveTab(value: string | number | undefined) {
		if (value === undefined) {
			return;
		}

		this.activeTab.set(value);
	}

	protected addGraphNode(kind: GraphNodeKind) {
		if (kind === 'result' && this.graphHasResultNode()) {
			return;
		}

		const nodeState = createGraphNodeState(kind, this.graphNodes().length);
		const runtimeNode = createRuntimeGraphNode(nodeState, null);
		this.graphNodes.update(nodes => [...nodes, runtimeNode]);
		this.selectedGraphNodeId.set(runtimeNode.id);
	}

	protected onGraphConnect(connection: Connection) {
		const edgeId = `${connection.source}:${connection.sourceHandle ?? 'out'} -> ${connection.target}:${connection.targetHandle ?? 'in'}`;

		if (this.graphEdges().some(edge => edge.id === edgeId)) {
			return;
		}

		this.graphEdges.update(edges => [
			...edges,
			{
				id: edgeId,
				source: connection.source,
				target: connection.target,
				sourceHandle: connection.sourceHandle,
				targetHandle: connection.targetHandle
			}
		]);
	}

	protected onGraphSelectionChange(
		changes: Array<{ id: string; selected: boolean }>
	) {
		const selected = changes.find(change => change.selected);
		this.selectedGraphNodeId.set(selected?.id ?? null);
	}

	protected updateSelectedSourceValue(sourceValueId: string | null) {
		this.patchSelectedGraphNodeData({
			sourceValueId,
			sourceValueName: sourceValueId
				? this.values().find(value => value.id === sourceValueId)?.name ?? null
				: null
		});
	}

	protected updateSelectedConstantValue(value: number) {
		this.patchSelectedGraphNodeData({ constantValue: value });
	}

	protected updateSelectedOperation(operation: GraphOperation) {
		this.patchSelectedGraphNodeData({ operation });
	}

	protected addSelectedCurveRange() {
		const data = this.selectedGraphNodeData();
		if (data?.kind !== 'curve') {
			return;
		}

		const lastRange = data.curveRanges?.[data.curveRanges.length - 1];
		const nextFrom = lastRange ? lastRange.to + 1 : 0;

		this.patchSelectedGraphNodeData({
			curveRanges: [
				...(data.curveRanges ?? []),
				{
					id: crypto.randomUUID(),
					from: nextFrom,
					to: nextFrom,
					result: lastRange?.result ?? 0
				}
			]
		});
	}

	protected updateSelectedCurveRange(
		rangeId: string,
		patch: Partial<Omit<CurveRange, 'id'>>
	) {
		const data = this.selectedGraphNodeData();
		if (data?.kind !== 'curve') {
			return;
		}

		this.patchSelectedGraphNodeData({
			curveRanges: (data.curveRanges ?? []).map(range =>
				range.id === rangeId ? { ...range, ...patch } : range
			)
		});
	}

	protected removeSelectedCurveRange(rangeId: string) {
		const data = this.selectedGraphNodeData();
		if (data?.kind !== 'curve') {
			return;
		}

		this.patchSelectedGraphNodeData({
			curveRanges: (data.curveRanges ?? []).filter(range => range.id !== rangeId)
		});
	}

	protected clearSelectedGraphNodeInputs() {
		const nodeId = this.selectedGraphNodeId();
		if (!nodeId) {
			return;
		}

		this.graphEdges.update(edges => edges.filter(edge => edge.target !== nodeId));
	}

	protected removeSelectedGraphNode() {
		const nodeId = this.selectedGraphNodeId();
		if (!nodeId) {
			return;
		}

		this.graphNodes.update(nodes => nodes.filter(node => node.id !== nodeId));
		this.graphEdges.update(edges =>
			edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
		);
		this.selectedGraphNodeId.set(null);
	}

	protected resetDraft() {
		const selected = this.selectedValue();
		if (!selected) {
			return;
		}

		const nextDraft = structuredClone(selected);
		this.draft.set(nextDraft);
		this.loadGraphFromValue(nextDraft);
	}

	protected saveDraft() {
		const draft = this.draft();
		if (!draft || draft.baseSourceType !== 'computed') {
			return;
		}

		const nextValue: SystemValue = {
			...draft,
			calculationGraph: this.currentGraphState()
		};

		this.valuesRepository
			.updateCalculation(
				nextValue.kind,
				nextValue.id,
				nextValue.baseSourceType,
				nextValue.calculationGraph
			)
			.subscribe({
				next: () => {
					this.values.update(values =>
						values.map(value => (value.id === nextValue.id ? nextValue : value))
					);
					this.draft.set(structuredClone(nextValue));
					this.errorMessage.set(null);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось сохранить граф расчёта.'
					);
				}
			});
	}

	protected graphNodeTypeLabel(kind: GraphNodeKind) {
		return GRAPH_NODE_TYPES.find(item => item.kind === kind)?.label ?? kind;
	}

	protected kindLabel(kind: SystemValue['kind']) {
		switch (kind) {
			case 'attribute':
				return 'Атрибут';
			case 'characteristic':
				return 'Характеристика';
			case 'skill':
				return 'Навык';
		}
	}

	protected modeTagLabel(value: SystemValue) {
		return value.baseSourceType === 'computed'
			? 'Вычисляется'
			: 'База персонажа';
	}

	protected modeTagSeverity(value: SystemValue) {
		return value.baseSourceType === 'computed' ? 'info' : 'secondary';
	}

	protected baseSourceLabel(value: SystemValue) {
		return getSystemValueBaseSourceLabel(value.baseSourceType);
	}

	protected currentBaseLabel(value: SystemValue) {
		switch (value.kind) {
			case 'attribute':
				return 'Текущее превью';
			case 'characteristic':
				return 'Значение по умолчанию';
			case 'skill':
				return 'Начальный уровень';
		}
	}

	protected selectedSourceValueName() {
		const sourceValueId = this.selectedGraphNodeData()?.sourceValueId;
		return sourceValueId
			? this.values().find(value => value.id === sourceValueId)?.name ?? 'Не найдено'
			: 'Не выбрано';
	}

	protected setTestSourceValue(sourceValueId: string, value: number | null | undefined) {
		this.testSourceValues.update(current => ({
			...current,
			[sourceValueId]: value ?? 0
		}));
	}

	protected getTestSourceValue(sourceValueId: string) {
		return this.testSourceValues()[sourceValueId] ?? 0;
	}

	private loadValues() {
		this.loading.set(true);
		this.errorMessage.set(null);

		this.valuesRepository.loadCatalog().subscribe({
			next: (catalog: SystemValuesCatalog) => {
				this.values.set(catalog.values);
				this.loading.set(false);

				if (catalog.values.length) {
					this.selectValueInternal(catalog.values[0].id);
				}
			},
			error: error => {
				this.loading.set(false);
				this.errorMessage.set(
					error instanceof Error ? error.message : 'Не удалось загрузить значения.'
				);
			}
		});
	}

	private selectValueInternal(valueId: string) {
		const nextValue = this.values().find(value => value.id === valueId);
		if (!nextValue) {
			return;
		}

		this.selectedValueId.set(valueId);
		this.activeTab.set('calculation');

		const nextDraft = structuredClone(nextValue);
		this.draft.set(nextDraft);
		this.loadGraphFromValue(nextDraft);
		this.initializeTestSourceValues();
	}

	private loadGraphFromValue(value: SystemValue) {
		if (value.baseSourceType !== 'computed' || !value.calculationGraph) {
			this.graphNodes.set([]);
			this.graphEdges.set([]);
			this.selectedGraphNodeId.set(null);
			return;
		}

		this.graphNodes.set(
			value.calculationGraph.nodes.map(node =>
				createRuntimeGraphNode(
					node,
					node.sourceValueId
						? this.values().find(item => item.id === node.sourceValueId)?.name ?? null
						: null
				)
			)
		);
		this.graphEdges.set(value.calculationGraph.edges.map(edge => ({ ...edge })));
		this.selectedGraphNodeId.set(value.calculationGraph.nodes[0]?.id ?? null);
	}

	private initializeTestSourceValues() {
		this.testSourceValues.set(
			Object.fromEntries(
				this.testInputs().map(input => [input.id, input.defaultValue])
			)
		);
	}

	private patchSelectedGraphNodeData(patch: Partial<ValueGraphNodeData>) {
		const node = this.selectedGraphNode();
		if (!node?.data) {
			return;
		}

		node.data.update(current => ({
			...(current ?? { kind: 'constant' as GraphNodeKind }),
			...patch
		}));
	}

	private isConnectionValid(connection: Connection) {
		if (connection.source === connection.target) {
			return false;
		}

		const targetNode = this.graphNodes().find(node => node.id === connection.target);
		const targetData = targetNode?.data?.();

		if (!targetNode || !targetData) {
			return false;
		}

		if (targetData.kind === 'curve' || targetData.kind === 'result') {
			return !this.graphEdges().some(
				edge =>
					edge.target === targetNode.id &&
					(edge.targetHandle ?? 'in') === (connection.targetHandle ?? 'in')
			);
		}

		if (
			targetData.kind === 'operation' &&
			(targetData.operation === 'subtract' || targetData.operation === 'divide')
		) {
			return !this.graphEdges().some(
				edge =>
					edge.target === targetNode.id &&
					(edge.targetHandle ?? 'a') === (connection.targetHandle ?? 'a')
			);
		}

		return true;
	}

	private resolveStoredFinalValue(value: SystemValue): number {
		if (value.baseSourceType !== 'computed') {
			return value.baseValue;
		}

		if (!value.calculationGraph) {
			return 0;
		}

		return this.evaluateGraph(value.calculationGraph).finalBase;
	}

	private evaluateGraph(
		graph: ValueGraphState,
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

		const beforeResultNode = this.findIncomingNode(resultNode.id, graph);
		const finalBase = this.evaluateGraphNode(
			resultNode.id,
			graph,
			breakdown,
			new Set<string>(),
			sourceOverrides
		);
		const rawBase =
			beforeResultNode?.kind === 'curve'
				? this.evaluateIncomingValue(beforeResultNode.id, graph, sourceOverrides)
				: finalBase;

		return {
			rawBase,
			calculatedBase: finalBase,
			finalBase,
			breakdown
		};
	}

	private evaluateIncomingValue(
		nodeId: string,
		graph: ValueGraphState,
		sourceOverrides?: Record<string, number>
	) {
		const incoming = graph.edges.find(edge => edge.target === nodeId);
		if (!incoming) {
			return 0;
		}

		return this.evaluateGraphNode(
			incoming.source,
			graph,
			[],
			new Set<string>(),
			sourceOverrides
		);
	}

	private evaluateGraphNode(
		nodeId: string,
		graph: ValueGraphState,
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
					? this.values().find(value => value.id === node.sourceValueId)
					: null;
				result =
					node.sourceValueId && sourceOverrides?.[node.sourceValueId] !== undefined
						? sourceOverrides[node.sourceValueId]
						: referencedValue
							? this.resolveStoredFinalValue(referencedValue)
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
									? this.evaluateGraphNode(
											edge.source,
											graph,
											breakdown,
											visited,
											sourceOverrides
									  )
									: 0;
							})
						: incomingEdges.map(edge =>
								this.evaluateGraphNode(
									edge.source,
									graph,
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
				const incoming = this.findIncomingNode(node.id, graph);
				const sourceValue = incoming
					? this.evaluateGraphNode(
							incoming.id,
							graph,
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
				const incoming = this.findIncomingNode(node.id, graph);
				result = incoming
					? this.evaluateGraphNode(
							incoming.id,
							graph,
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

	private findIncomingNode(nodeId: string, graph: ValueGraphState) {
		const incoming = graph.edges.find(edge => edge.target === nodeId);
		return incoming ? graph.nodes.find(node => node.id === incoming.source) ?? null : null;
	}
}

function createGraphNodeState(kind: GraphNodeKind, index: number): ValueGraphNodeState {
	const id = `${kind}-${crypto.randomUUID()}`;
	const x = kind === 'result' ? 780 : kind === 'curve' ? 540 : 120 + (index % 2) * 160;
	const y = 48 + index * 72;

	switch (kind) {
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

function createRuntimeGraphNode(
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

function serializeGraphNode(
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

function serializeGraphEdge(edge: Edge): ValueGraphEdgeState {
	return {
		id: edge.id,
		source: edge.source,
		target: edge.target,
		sourceHandle: edge.sourceHandle,
		targetHandle: edge.targetHandle
	};
}

function normalizeGraphState(
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

function operationLabel(operation: GraphOperation): string {
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

function formatNumber(value: number): string {
	return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
