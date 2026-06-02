import { CommonModule } from '@angular/common';
import {
	Component,
	computed,
	effect,
	HostListener,
	input,
	output,
	signal,
	untracked
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Fluid } from 'primeng/fluid';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { Splitter } from 'primeng/splitter';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import {
	Connection,
	ConnectionSettings,
	ComponentNode,
	Edge,
	Vflow
} from 'ngx-vflow';
import {
	evaluateGraph,
	formatNumber,
	resolveStoredFinalValue
} from '../../../domain/value-graph.engine';
import { areCalculationDefinitionsEqual } from '../../../domain/system-value-calculation-draft';
import {
	createGraphNodeState,
	createRuntimeGraphNode,
	normalizeGraphState,
	serializeGraphEdge,
	serializeGraphNode
} from '../../../domain/value-graph.runtime';
import { SystemValue } from '../../../domain/values.models';
import { SystemValueCalculationDefinition } from '../../../domain/system-value-calculation.models';
import {
	createSystemValueOptionGroups,
	SystemValueOptionGroup
} from '../../../domain/system-value-option-groups';
import {
	CurveRange,
	GraphComparison,
	GraphNodeKind,
	GraphOperation,
	ValueGraphNodeData,
	ValueGraphState
} from '../../value-graph.models';

interface ValueTestInputViewModel {
	id: string;
	name: string;
	groupLabel: string;
	defaultValue: number;
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

const COMPARISON_OPTIONS = [
	{ label: 'Равно', value: 'eq' as GraphComparison },
	{ label: 'Не равно', value: 'ne' as GraphComparison },
	{ label: 'Больше', value: 'gt' as GraphComparison },
	{ label: 'Больше или равно', value: 'gte' as GraphComparison },
	{ label: 'Меньше', value: 'lt' as GraphComparison },
	{ label: 'Меньше или равно', value: 'lte' as GraphComparison }
];

const GRAPH_NODE_TYPES: GraphNodeType[] = [
	{ kind: 'characterInput', label: 'Ввод персонажа' },
	{ kind: 'source', label: 'Источник' },
	{ kind: 'constant', label: 'Число' },
	{ kind: 'operation', label: 'Операция' },
	{ kind: 'comparison', label: 'Сравнение' },
	{ kind: 'condition', label: 'Если' },
	{ kind: 'curve', label: 'Шкала уровней' },
	{ kind: 'result', label: 'Результат' }
];

@Component({
	selector: 'app-system-value-calculation-editor',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Button,
		Fluid,
		InputNumber,
		Select,
		Splitter,
		Tab,
		TabList,
		TabPanel,
		TabPanels,
		Tabs,
		Vflow
	],
	templateUrl: './system-value-calculation-editor.component.html',
	styleUrl: './system-value-calculation-editor.component.scss'
})
export class SystemValueCalculationEditorComponent {
	readonly systemValue = input<SystemValueCalculationDefinition | null>(null);
	readonly availableValues = input<SystemValue[]>([]);
	readonly systemValueChange = output<SystemValueCalculationDefinition>();

	protected readonly activeTab = signal<string | number>('calculation');
	protected readonly graphNodes = signal<ComponentNode<ValueGraphNodeData>[]>(
		[]
	);
	protected readonly graphEdges = signal<Edge[]>([]);
	protected readonly selectedGraphNodeId = signal<string | null>(null);
	protected readonly selectedGraphEdgeId = signal<string | null>(null);
	protected readonly testSourceValues = signal<Record<string, number>>({});
	protected readonly graphNodeTypes = GRAPH_NODE_TYPES;
	protected readonly operationOptions = OPERATION_OPTIONS;
	protected readonly comparisonOptions = COMPARISON_OPTIONS;
	protected readonly graphConnectionSettings: ConnectionSettings = {
		marker: { type: 'arrow-closed' },
		validator: connection => this.isConnectionValid(connection)
	};
	private syncedAvailableValuesSignature: string | null = null;
	private pendingSelectionClear: ReturnType<typeof setTimeout> | null = null;

	protected readonly currentGraphState = computed<ValueGraphState | null>(() =>
		normalizeGraphState({
			nodes: this.graphNodes().map(serializeGraphNode),
			edges: this.graphEdges().map(serializeGraphEdge)
		})
	);

	protected readonly dependencyGroups = computed<SystemValueOptionGroup[]>(() => {
		const currentValueId = this.systemValue()?.id;
		return createSystemValueOptionGroups(this.availableValues(), {
			excludeIds: [currentValueId]
		});
	});

	protected readonly selectedGraphNode = computed(() => {
		const nodeId = this.selectedGraphNodeId();
		return nodeId
			? (this.graphNodes().find(node => node.id === nodeId) ?? null)
			: null;
	});

	protected readonly selectedGraphNodeData = computed(
		() => this.selectedGraphNode()?.data?.() ?? null
	);

	protected readonly selectedGraphEdge = computed(() => {
		const edgeId = this.selectedGraphEdgeId();
		return edgeId
			? (this.graphEdges().find(edge => edge.id === edgeId) ?? null)
			: null;
	});

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
			if (
				node.kind !== 'source' ||
				!node.sourceValueId ||
				seen.has(node.sourceValueId)
			) {
				continue;
			}

			seen.add(node.sourceValueId);
			const value = this.availableValues().find(
				item => item.id === node.sourceValueId
			);

			if (!value) {
				continue;
			}

			inputs.push({
				id: value.id,
				name: value.name,
				groupLabel: value.contextLabel
					? `${value.groupLabel} / ${value.contextLabel}`
					: value.groupLabel,
				defaultValue: resolveStoredFinalValue(value, this.availableValues())
			});
		}

		return inputs;
	});

	protected readonly testResult = computed(() => {
		const graph = this.currentGraphState();

		if (!graph) {
			return {
				final: 0,
				breakdown: ['Граф расчёта не задан.']
			};
		}

		const result = evaluateGraph(
			graph,
			this.availableValues(),
			this.testSourceValues()
		);

		return {
			final: result.finalBase,
			breakdown: result.breakdown
		};
	});

	constructor() {
		effect(() => {
			const systemValue = this.systemValue();
			const availableValues = this.availableValues();

			untracked(() => {
				const availableValuesSignature =
					this.createAvailableValuesSignature(availableValues);
				const shouldRefreshValueLabels =
					availableValuesSignature !== this.syncedAvailableValuesSignature;

				if (!systemValue) {
					this.loadGraph(null, availableValues);
					this.initializeTestSourceValues();
					this.syncedAvailableValuesSignature = availableValuesSignature;
					return;
				}

				if (!this.isCurrentStateEqualTo(systemValue)) {
					this.loadGraph(systemValue.calculationGraph, availableValues);
					this.initializeTestSourceValues();
					this.syncedAvailableValuesSignature = availableValuesSignature;
					return;
				}

				if (shouldRefreshValueLabels) {
					this.refreshGraphSourceNames(availableValues);
					this.initializeTestSourceValues();
					this.syncedAvailableValuesSignature = availableValuesSignature;
				}
			});
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
		this.selectedGraphEdgeId.set(null);
		this.selectedGraphNodeId.set(runtimeNode.id);
		this.emitDraft();
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
		this.emitDraft();
	}

	protected onGraphSelectionChange(
		changes: Array<{ id: string; selected: boolean }>
	) {
		const selected = changes.find(change => change.selected);
		if (selected) {
			this.cancelPendingSelectionClear();
			this.selectedGraphEdgeId.set(null);
			this.selectedGraphNodeId.set(selected.id);
			return;
		}

		const currentNodeId = this.selectedGraphNodeId();
		const currentWasDeselected = changes.some(
			change => change.id === currentNodeId && !change.selected
		);

		if (!currentWasDeselected) {
			return;
		}

		this.scheduleSelectionClear();
	}

	protected onGraphEdgeSelectionChange(
		changes: Array<{ id: string; selected: boolean }>
	) {
		const selected = changes.find(change => change.selected);
		if (selected) {
			this.cancelPendingSelectionClear();
			this.selectedGraphNodeId.set(null);
			this.selectedGraphEdgeId.set(selected.id);
			return;
		}

		const currentEdgeId = this.selectedGraphEdgeId();
		const currentWasDeselected = changes.some(
			change => change.id === currentEdgeId && !change.selected
		);

		if (currentWasDeselected) {
			this.selectedGraphEdgeId.set(null);
		}
	}

	protected onGraphDragEnd() {
		this.emitDraft();
	}

	protected updateSelectedSourceValue(sourceValueId: string | null) {
		this.patchSelectedGraphNodeData({
			sourceValueId,
			sourceValueName: sourceValueId
				? (this.availableValues().find(value => value.id === sourceValueId)
						?.name ?? null)
				: null
		});
		this.emitDraft();
		this.initializeTestSourceValues();
	}

	protected updateSelectedConstantValue(value: number) {
		this.patchSelectedGraphNodeData({ constantValue: value });
		this.emitDraft();
	}

	protected updateSelectedOperation(operation: GraphOperation) {
		this.patchSelectedGraphNodeData({ operation });
		this.emitDraft();
	}

	protected updateSelectedComparison(comparison: GraphComparison) {
		this.patchSelectedGraphNodeData({ comparison });
		this.emitDraft();
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
		this.emitDraft();
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
		this.emitDraft();
	}

	protected removeSelectedCurveRange(rangeId: string) {
		const data = this.selectedGraphNodeData();
		if (data?.kind !== 'curve') {
			return;
		}

		this.patchSelectedGraphNodeData({
			curveRanges: (data.curveRanges ?? []).filter(
				range => range.id !== rangeId
			)
		});
		this.emitDraft();
	}

	protected clearSelectedGraphNodeInputs() {
		const nodeId = this.selectedGraphNodeId();
		if (!nodeId) {
			return;
		}

		this.graphEdges.update(edges =>
			edges.filter(edge => edge.target !== nodeId)
		);
		this.emitDraft();
	}

	protected removeSelectedGraphNode() {
		const nodeId = this.selectedGraphNodeId();
		if (!nodeId) {
			return;
		}

		const node = this.selectedGraphNode();
		if (node?.data?.()?.kind === 'result') {
			return;
		}

		this.graphNodes.update(nodes => nodes.filter(node => node.id !== nodeId));
		this.graphEdges.update(edges =>
			edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
		);
		this.selectedGraphNodeId.set(null);
		this.selectedGraphEdgeId.set(null);
		this.emitDraft();
		this.initializeTestSourceValues();
	}

	protected removeSelectedGraphEdge() {
		const edgeId = this.selectedGraphEdgeId();
		if (!edgeId) {
			return;
		}

		this.graphEdges.update(edges => edges.filter(edge => edge.id !== edgeId));
		this.selectedGraphEdgeId.set(null);
		this.emitDraft();
	}

	protected graphNodeTypeLabel(kind: GraphNodeKind) {
		return GRAPH_NODE_TYPES.find(item => item.kind === kind)?.label ?? kind;
	}

	protected selectedSourceValueName() {
		const sourceValueId = this.selectedGraphNodeData()?.sourceValueId;
		return sourceValueId
			? (this.availableValues().find(value => value.id === sourceValueId)
					?.name ?? 'Не найдено')
			: 'Не выбрано';
	}

	protected setTestSourceValue(
		sourceValueId: string,
		value: number | null | undefined
	) {
		this.testSourceValues.update(current => ({
			...current,
			[sourceValueId]: value ?? 0
		}));
	}

	protected getTestSourceValue(sourceValueId: string) {
		return this.testSourceValues()[sourceValueId] ?? 0;
	}

	protected formatResultValue(value: number | null) {
		return value === null ? '—' : formatNumber(value);
	}

	@HostListener('document:keydown', ['$event'])
	protected onDocumentKeyDown(event: KeyboardEvent) {
		if (event.key !== 'Delete' && event.key !== 'Backspace') {
			return;
		}

		if (this.isTextInputEvent(event)) {
			return;
		}

		if (this.selectedGraphEdgeId()) {
			event.preventDefault();
			this.removeSelectedGraphEdge();
			return;
		}

		if (this.selectedGraphNodeId()) {
			event.preventDefault();
			this.removeSelectedGraphNode();
		}
	}

	private emitDraft() {
		const systemValue = this.systemValue();
		if (!systemValue) {
			return;
		}

		this.systemValueChange.emit({
			...systemValue,
			calculationGraph: this.currentGraphState()
		});
	}

	private loadGraph(graph: ValueGraphState | null, values: SystemValue[]) {
		if (!graph) {
			this.graphNodes.set([]);
			this.graphEdges.set([]);
			this.selectedGraphNodeId.set(null);
			this.selectedGraphEdgeId.set(null);
			return;
		}

		this.graphNodes.set(
			graph.nodes.map(node =>
				createRuntimeGraphNode(
					node,
					node.sourceValueId
						? (values.find(item => item.id === node.sourceValueId)?.name ??
								null)
						: null
				)
			)
		);
		this.graphEdges.set(graph.edges.map(edge => ({ ...edge })));
		this.selectedGraphNodeId.set(graph.nodes[0]?.id ?? null);
		this.selectedGraphEdgeId.set(null);
	}

	private initializeTestSourceValues() {
		this.testSourceValues.set(
			Object.fromEntries(
				this.testInputs().map(input => [input.id, input.defaultValue])
			)
		);
	}

	private isCurrentStateEqualTo(systemValue: SystemValueCalculationDefinition) {
		return areCalculationDefinitionsEqual(systemValue, {
			...systemValue,
			calculationGraph: this.currentGraphState()
		});
	}

	private refreshGraphSourceNames(values: SystemValue[]) {
		for (const node of this.graphNodes()) {
			const data = node.data?.();

			if (!node.data || data?.kind !== 'source' || !data.sourceValueId) {
				continue;
			}

			const sourceValueName =
				values.find(value => value.id === data.sourceValueId)?.name ?? null;

			if (data.sourceValueName !== sourceValueName) {
				node.data.update(current =>
					current ? { ...current, sourceValueName } : current
				);
			}
		}
	}

	private createAvailableValuesSignature(values: SystemValue[]) {
		return JSON.stringify(
			values.map(value => [
				value.id,
				value.name,
				value.groupLabel,
				value.contextLabel,
				value.baseValue
			])
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

	private cancelPendingSelectionClear() {
		if (!this.pendingSelectionClear) {
			return;
		}

		clearTimeout(this.pendingSelectionClear);
		this.pendingSelectionClear = null;
	}

	private scheduleSelectionClear() {
		this.cancelPendingSelectionClear();
		this.pendingSelectionClear = setTimeout(() => {
			this.selectedGraphNodeId.set(null);
			this.pendingSelectionClear = null;
		});
	}

	private isTextInputEvent(event: KeyboardEvent) {
		const target = event.target;

		if (!(target instanceof HTMLElement)) {
			return false;
		}

		return (
			target.isContentEditable ||
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.tagName === 'SELECT'
		);
	}

	private isConnectionValid(connection: Connection) {
		if (connection.source === connection.target) {
			return false;
		}

		const targetNode = this.graphNodes().find(
			node => node.id === connection.target
		);
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
			return this.isTargetHandleAvailable(targetNode.id, connection, 'a');
		}

		if (targetData.kind === 'comparison') {
			return this.isTargetHandleAvailable(targetNode.id, connection, 'in');
		}

		if (targetData.kind === 'condition') {
			return this.isTargetHandleAvailable(targetNode.id, connection, 'condition');
		}

		return true;
	}

	private isTargetHandleAvailable(
		targetNodeId: string,
		connection: Connection,
		defaultHandleId: string
	) {
		return !this.graphEdges().some(
			edge =>
				edge.target === targetNodeId &&
				(edge.targetHandle ?? defaultHandleId) ===
					(connection.targetHandle ?? defaultHandleId)
		);
	}
}
