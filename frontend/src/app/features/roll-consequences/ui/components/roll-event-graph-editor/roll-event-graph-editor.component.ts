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
import {
	Connection,
	ConnectionSettings,
	ComponentNode,
	Edge,
	Vflow
} from 'ngx-vflow';
import { createSystemValueOptionGroups } from '../../../../values/domain/system-value-option-groups';
import { SystemValue } from '../../../../values/domain/values.models';
import {
	createRollEventGraphNodeState,
	createRollEventRuntimeNode,
	normalizeRollEventGraph,
	serializeRollEventGraphEdge,
	serializeRollEventGraphNode
} from '../../../domain/roll-event-graph.runtime';
import {
	RollEventGraphComparison,
	RollEventGraphDefinition,
	RollEventGraphNodeData,
	RollEventGraphNodeKind,
	RollEventGraphOperation,
	RollEventThresholdOverflowMode,
	RollEventThresholdResetMode,
	RollEventThresholdSource
} from '../../../domain/roll-event-graph.models';

interface EventNodeType {
	kind: RollEventGraphNodeKind;
	label: string;
}

const NODE_TYPES: EventNodeType[] = [
	{ kind: 'eventInput', label: 'Данные броска' },
	{ kind: 'valueSource', label: 'Значение' },
	{ kind: 'constant', label: 'Число' },
	{ kind: 'operation', label: 'Операция' },
	{ kind: 'comparison', label: 'Сравнение' },
	{ kind: 'condition', label: 'Если' },
	{ kind: 'thresholdCounter', label: 'Накопитель с порогом' },
	{ kind: 'writeValue', label: 'Записать значение' }
];

const EVENT_INPUT_OPTIONS = [
	{ label: 'Количество кубов', value: 'diceCount' },
	{ label: 'Успехи', value: 'successes' },
	{ label: 'Выпавшие шестерки', value: 'sixes' },
	{ label: 'Выпавшие единицы', value: 'ones' },
	{ label: 'Игнорированные единицы', value: 'ignoredOnes' },
	{ label: 'Количество последствий', value: 'consequenceCount' },
	{ label: 'Уровень навыка', value: 'skillLevel' }
];

const OPERATION_OPTIONS = [
	{ label: 'Сложить', value: 'sum' as RollEventGraphOperation },
	{ label: 'Минимум', value: 'min' as RollEventGraphOperation },
	{ label: 'Максимум', value: 'max' as RollEventGraphOperation },
	{ label: 'Умножить', value: 'multiply' as RollEventGraphOperation },
	{ label: 'Вычесть', value: 'subtract' as RollEventGraphOperation },
	{ label: 'Разделить', value: 'divide' as RollEventGraphOperation }
];

const COMPARISON_OPTIONS = [
	{ label: 'Равно', value: 'eq' as RollEventGraphComparison },
	{ label: 'Не равно', value: 'ne' as RollEventGraphComparison },
	{ label: 'Больше', value: 'gt' as RollEventGraphComparison },
	{ label: 'Больше или равно', value: 'gte' as RollEventGraphComparison },
	{ label: 'Меньше', value: 'lt' as RollEventGraphComparison },
	{ label: 'Меньше или равно', value: 'lte' as RollEventGraphComparison }
];

const THRESHOLD_SOURCE_OPTIONS = [
	{ label: 'Базовое значение', value: 'base' as RollEventThresholdSource },
	{ label: 'Итоговое значение', value: 'final' as RollEventThresholdSource }
];

const RESET_MODE_OPTIONS = [
	{ label: 'Сбросить в 0', value: 'zero' as RollEventThresholdResetMode },
	{
		label: 'Вычесть порог',
		value: 'subtractThreshold' as RollEventThresholdResetMode
	}
];

const OVERFLOW_MODE_OPTIONS = [
	{
		label: 'Один раз за событие',
		value: 'single' as RollEventThresholdOverflowMode
	},
	{
		label: 'За каждый полный порог',
		value: 'multiple' as RollEventThresholdOverflowMode
	}
];

@Component({
	selector: 'app-roll-event-graph-editor',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Button,
		Fluid,
		InputNumber,
		Select,
		Splitter,
		Vflow
	],
	templateUrl: './roll-event-graph-editor.component.html',
	styleUrl: './roll-event-graph-editor.component.scss'
})
export class RollEventGraphEditorComponent {
	readonly graph = input<RollEventGraphDefinition | null>(null);
	readonly availableValues = input<SystemValue[]>([]);
	readonly graphChange = output<RollEventGraphDefinition | null>();

	protected readonly graphNodes = signal<ComponentNode<RollEventGraphNodeData>[]>(
		[]
	);
	protected readonly graphEdges = signal<Edge[]>([]);
	protected readonly selectedGraphNodeId = signal<string | null>(null);
	protected readonly selectedGraphEdgeId = signal<string | null>(null);
	protected readonly nodeTypes = NODE_TYPES;
	protected readonly eventInputOptions = EVENT_INPUT_OPTIONS;
	protected readonly operationOptions = OPERATION_OPTIONS;
	protected readonly comparisonOptions = COMPARISON_OPTIONS;
	protected readonly thresholdSourceOptions = THRESHOLD_SOURCE_OPTIONS;
	protected readonly resetModeOptions = RESET_MODE_OPTIONS;
	protected readonly overflowModeOptions = OVERFLOW_MODE_OPTIONS;
	protected readonly connectionSettings: ConnectionSettings = {
		marker: { type: 'arrow-closed' },
		validator: connection => this.isConnectionValid(connection)
	};
	private syncedGraphSignature: string | null = null;
	private syncedValuesSignature: string | null = null;
	private pendingSelectionClear: ReturnType<typeof setTimeout> | null = null;

	protected readonly currentGraphState = computed(() =>
		normalizeRollEventGraph({
			nodes: this.graphNodes().map(serializeRollEventGraphNode),
			edges: this.graphEdges().map(serializeRollEventGraphEdge)
		})
	);
	protected readonly valueGroups = computed(() =>
		createSystemValueOptionGroups(this.availableValues())
	);
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

	constructor() {
		effect(() => {
			const graph = this.graph();
			const values = this.availableValues();
			const graphSignature = JSON.stringify(graph ?? null);
			const valuesSignature = JSON.stringify(
				values.map(value => [value.id, value.name, value.groupLabel, value.contextLabel])
			);

			untracked(() => {
				if (
					graphSignature !== this.syncedGraphSignature ||
					valuesSignature !== this.syncedValuesSignature
				) {
					this.loadGraph(graph);
					this.syncedGraphSignature = graphSignature;
					this.syncedValuesSignature = valuesSignature;
				}
			});
		});
	}

	protected addGraphNode(kind: RollEventGraphNodeKind) {
		const nodeState = createRollEventGraphNodeState(
			kind,
			this.graphNodes().length
		);
		const runtimeNode = createRollEventRuntimeNode(
			nodeState,
			this.createValueNames()
		);
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

		if (currentWasDeselected) {
			this.scheduleSelectionClear();
		}
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
		this.selectedGraphEdgeId.set(null);
		this.emitDraft();
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

	protected updateSelectedEventInput(eventInputKey: RollEventGraphNodeData['eventInputKey']) {
		this.patchSelectedGraphNodeData({ eventInputKey });
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
	}

	protected updateSelectedTargetValue(targetValueId: string | null) {
		this.patchSelectedGraphNodeData({
			targetValueId,
			targetValueName: targetValueId
				? (this.availableValues().find(value => value.id === targetValueId)
						?.name ?? null)
				: null
		});
		this.emitDraft();
	}

	protected updateSelectedAccumulatorValue(accumulatorValueId: string | null) {
		this.patchSelectedGraphNodeData({
			accumulatorValueId,
			accumulatorValueName: this.getValueName(accumulatorValueId)
		});
		this.emitDraft();
	}

	protected updateSelectedThresholdValue(thresholdValueId: string | null) {
		this.patchSelectedGraphNodeData({
			thresholdValueId,
			thresholdValueName: this.getValueName(thresholdValueId)
		});
		this.emitDraft();
	}

	protected updateSelectedOverflowValue(overflowValueId: string | null) {
		this.patchSelectedGraphNodeData({
			overflowValueId,
			overflowValueName: this.getValueName(overflowValueId)
		});
		this.emitDraft();
	}

	protected updateSelectedThresholdSource(
		thresholdSource: RollEventThresholdSource
	) {
		this.patchSelectedGraphNodeData({ thresholdSource });
		this.emitDraft();
	}

	protected updateSelectedResetMode(resetMode: RollEventThresholdResetMode) {
		this.patchSelectedGraphNodeData({ resetMode });
		this.emitDraft();
	}

	protected updateSelectedOverflowMode(
		overflowMode: RollEventThresholdOverflowMode
	) {
		this.patchSelectedGraphNodeData({ overflowMode });
		this.emitDraft();
	}

	protected updateSelectedOverflowIncrement(overflowIncrement: number) {
		this.patchSelectedGraphNodeData({ overflowIncrement });
		this.emitDraft();
	}

	protected updateSelectedConstantValue(value: number) {
		this.patchSelectedGraphNodeData({ constantValue: value });
		this.emitDraft();
	}

	protected updateSelectedOperation(operation: RollEventGraphOperation) {
		this.patchSelectedGraphNodeData({ operation });
		this.emitDraft();
	}

	protected updateSelectedComparison(comparison: RollEventGraphComparison) {
		this.patchSelectedGraphNodeData({ comparison });
		this.emitDraft();
	}

	protected graphNodeTypeLabel(kind: RollEventGraphNodeKind) {
		return NODE_TYPES.find(item => item.kind === kind)?.label ?? kind;
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
		const nextGraph = this.currentGraphState();
		this.syncedGraphSignature = JSON.stringify(nextGraph ?? null);
		this.graphChange.emit(nextGraph);
	}

	private loadGraph(graph: RollEventGraphDefinition | null) {
		const normalized = normalizeRollEventGraph(graph);
		const valueNames = this.createValueNames();

		if (!normalized) {
			this.graphNodes.set([]);
			this.graphEdges.set([]);
			this.selectedGraphNodeId.set(null);
			this.selectedGraphEdgeId.set(null);
			return;
		}

		this.graphNodes.set(
			normalized.nodes.map(node => createRollEventRuntimeNode(node, valueNames))
		);
		this.graphEdges.set(normalized.edges.map(edge => ({ ...edge })));
		this.selectedGraphNodeId.set(normalized.nodes[0]?.id ?? null);
		this.selectedGraphEdgeId.set(null);
	}

	private createValueNames() {
		return new Map(this.availableValues().map(value => [value.id, value.name]));
	}

	private patchSelectedGraphNodeData(patch: Partial<RollEventGraphNodeData>) {
		const node = this.selectedGraphNode();
		if (!node?.data) {
			return;
		}

		node.data.update(current => ({
			...(current ?? { kind: 'constant' as RollEventGraphNodeKind }),
			...patch
		}));
	}

	private isConnectionValid(connection: Connection) {
		const source = this.graphNodes().find(node => node.id === connection.source);
		const target = this.graphNodes().find(node => node.id === connection.target);
		const sourceKind = source?.data?.()?.kind;
		const targetKind = target?.data?.()?.kind;

		if (!sourceKind || !targetKind || connection.source === connection.target) {
			return false;
		}

		if (
			sourceKind === 'writeValue' ||
			sourceKind === 'thresholdCounter' ||
			targetKind === 'eventInput' ||
			targetKind === 'valueSource' ||
			targetKind === 'constant'
		) {
			return false;
		}

		const targetHandle = connection.targetHandle ?? 'in';
		if (targetKind === 'thresholdCounter') {
			return (
				targetHandle === 'increment' &&
				!this.graphEdges().some(
					edge => edge.target === connection.target && edge.targetHandle === targetHandle
				)
			);
		}

		if (targetKind !== 'operation') {
			return !this.graphEdges().some(
				edge => edge.target === connection.target && edge.targetHandle === targetHandle
			);
		}

		return true;
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
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.isContentEditable
		);
	}

	private getValueName(valueId: string | null) {
		return valueId
			? (this.availableValues().find(value => value.id === valueId)?.name ?? null)
			: null;
	}
}
