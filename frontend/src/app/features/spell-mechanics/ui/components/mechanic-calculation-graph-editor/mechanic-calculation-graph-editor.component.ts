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
import {
	MechanicCalculationComparison,
	MechanicCalculationGraphNodeData,
	MechanicCalculationGraphState,
	MechanicCalculationNodeKind,
	MechanicCalculationOperation,
	MechanicCalculationSourceGroup
} from '../../mechanic-calculation-graph.models';
import {
	createMechanicCalculationNodeState,
	createMechanicCalculationRuntimeNode,
	normalizeMechanicCalculationGraph,
	serializeMechanicCalculationEdge,
	serializeMechanicCalculationNode
} from '../../mechanic-calculation-graph.runtime';

interface GraphNodeType {
	kind: MechanicCalculationNodeKind;
	label: string;
}

const NODE_TYPES: GraphNodeType[] = [
	{ kind: 'source', label: 'Источник' },
	{ kind: 'constant', label: 'Число' },
	{ kind: 'operation', label: 'Операция' },
	{ kind: 'comparison', label: 'Сравнение' },
	{ kind: 'condition', label: 'Если' },
	{ kind: 'result', label: 'Результат' }
];

const OPERATION_OPTIONS = [
	{ label: 'Сложить', value: 'sum' as MechanicCalculationOperation },
	{ label: 'Среднее', value: 'average' as MechanicCalculationOperation },
	{ label: 'Минимум', value: 'min' as MechanicCalculationOperation },
	{ label: 'Максимум', value: 'max' as MechanicCalculationOperation },
	{ label: 'Умножить', value: 'multiply' as MechanicCalculationOperation },
	{ label: 'Вычесть', value: 'subtract' as MechanicCalculationOperation },
	{ label: 'Разделить', value: 'divide' as MechanicCalculationOperation },
	{ label: 'Степень', value: 'power' as MechanicCalculationOperation },
	{ label: 'Корень', value: 'sqrt' as MechanicCalculationOperation },
	{ label: 'Логарифм', value: 'log' as MechanicCalculationOperation },
	{ label: 'Экспонента', value: 'exp' as MechanicCalculationOperation },
	{ label: 'Округлить вниз', value: 'floor' as MechanicCalculationOperation },
	{ label: 'Округлить', value: 'round' as MechanicCalculationOperation },
	{ label: 'Округлить вверх', value: 'ceil' as MechanicCalculationOperation }
];

const COMPARISON_OPTIONS = [
	{ label: 'Равно', value: 'eq' as MechanicCalculationComparison },
	{ label: 'Не равно', value: 'ne' as MechanicCalculationComparison },
	{ label: 'Больше', value: 'gt' as MechanicCalculationComparison },
	{ label: 'Больше или равно', value: 'gte' as MechanicCalculationComparison },
	{ label: 'Меньше', value: 'lt' as MechanicCalculationComparison },
	{ label: 'Меньше или равно', value: 'lte' as MechanicCalculationComparison }
];

@Component({
	selector: 'app-mechanic-calculation-graph-editor',
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
	templateUrl: './mechanic-calculation-graph-editor.component.html',
	styleUrl: './mechanic-calculation-graph-editor.component.scss'
})
export class MechanicCalculationGraphEditorComponent {
	readonly graph = input<MechanicCalculationGraphState | null>(null);
	readonly sourceGroups = input<MechanicCalculationSourceGroup[]>([]);
	readonly graphChange = output<MechanicCalculationGraphState | null>();

	protected readonly graphNodes = signal<
		ComponentNode<MechanicCalculationGraphNodeData>[]
	>([]);
	protected readonly graphEdges = signal<Edge[]>([]);
	protected readonly selectedGraphNodeId = signal<string | null>(null);
	protected readonly selectedGraphEdgeId = signal<string | null>(null);
	protected readonly nodeTypes = NODE_TYPES;
	protected readonly operationOptions = OPERATION_OPTIONS;
	protected readonly comparisonOptions = COMPARISON_OPTIONS;
	protected readonly connectionSettings: ConnectionSettings = {
		marker: { type: 'arrow-closed' },
		validator: connection => this.isConnectionValid(connection)
	};
	private syncedSignature: string | null = null;
	private pendingSelectionClear: ReturnType<typeof setTimeout> | null = null;

	protected readonly currentGraphState = computed(() =>
		normalizeMechanicCalculationGraph({
			nodes: this.graphNodes().map(serializeMechanicCalculationNode),
			edges: this.graphEdges().map(serializeMechanicCalculationEdge)
		})
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
	protected readonly graphHasResultNode = computed(() =>
		this.graphNodes().some(node => node.data?.()?.kind === 'result')
	);

	constructor() {
		effect(() => {
			const graph = this.graph();
			const groups = this.sourceGroups();
			const signature = JSON.stringify({
				graph,
				sources: groups.map(group => [
					group.label,
					group.items.map(item => [item.id, item.name])
				])
			});

			untracked(() => {
				if (signature === this.syncedSignature) {
					return;
				}

				this.loadGraph(graph);
				this.syncedSignature = signature;
			});
		});
	}

	protected addGraphNode(kind: MechanicCalculationNodeKind) {
		if (kind === 'result' && this.graphHasResultNode()) {
			return;
		}

		const nodeState = createMechanicCalculationNodeState(
			kind,
			this.graphNodes().length
		);
		const runtimeNode = createMechanicCalculationRuntimeNode(nodeState, null);
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

	protected updateSelectedSource(sourceId: string | null) {
		this.patchSelectedGraphNodeData({
			sourceId,
			sourceName: sourceId ? this.sourceName(sourceId) : null
		});
		this.emitDraft();
	}

	protected updateSelectedConstantValue(value: number | null) {
		this.patchSelectedGraphNodeData({ constantValue: value ?? 0 });
		this.emitDraft();
	}

	protected updateSelectedOperation(operation: MechanicCalculationOperation) {
		this.patchSelectedGraphNodeData({ operation });
		this.emitDraft();
	}

	protected updateSelectedComparison(comparison: MechanicCalculationComparison) {
		this.patchSelectedGraphNodeData({ comparison });
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

	protected graphNodeTypeLabel(kind: MechanicCalculationNodeKind) {
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
		const graph = this.currentGraphState();
		this.syncedSignature = JSON.stringify({
			graph,
			sources: this.sourceGroups().map(group => [
				group.label,
				group.items.map(item => [item.id, item.name])
			])
		});
		this.graphChange.emit(graph);
	}

	private loadGraph(graph: MechanicCalculationGraphState | null) {
		if (!graph) {
			this.graphNodes.set([]);
			this.graphEdges.set([]);
			this.selectedGraphNodeId.set(null);
			this.selectedGraphEdgeId.set(null);
			return;
		}

		this.graphNodes.set(
			graph.nodes.map(node =>
				createMechanicCalculationRuntimeNode(
					node,
					node.sourceId ? this.sourceName(node.sourceId) : null
				)
			)
		);
		this.graphEdges.set(graph.edges.map(edge => ({ ...edge })));
		this.selectedGraphNodeId.set(graph.nodes[0]?.id ?? null);
		this.selectedGraphEdgeId.set(null);
	}

	private patchSelectedGraphNodeData(
		patch: Partial<MechanicCalculationGraphNodeData>
	) {
		const node = this.selectedGraphNode();
		if (!node?.data) {
			return;
		}

		node.data.update(current => ({
			...(current ?? { kind: 'constant' as MechanicCalculationNodeKind }),
			...patch
		}));
	}

	private sourceName(sourceId: string) {
		return (
			this.sourceGroups()
				.flatMap(group => group.items)
				.find(item => item.id === sourceId)?.name ?? null
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

		if (targetData.kind === 'result') {
			return this.isTargetHandleAvailable(targetNode.id, connection, 'in');
		}

		if (
			targetData.kind === 'operation' &&
			(targetData.operation === 'subtract' ||
				targetData.operation === 'divide' ||
				targetData.operation === 'power')
		) {
			return this.isTargetHandleAvailable(targetNode.id, connection, 'a');
		}

		if (
			targetData.kind === 'operation' &&
			isUnaryOperation(targetData.operation)
		) {
			return this.isTargetHandleAvailable(targetNode.id, connection, 'in');
		}

		if (targetData.kind === 'comparison') {
			return this.isTargetHandleAvailable(targetNode.id, connection, 'a');
		}

		if (targetData.kind === 'condition') {
			return this.isTargetHandleAvailable(targetNode.id, connection, 'condition');
		}

		return targetData.kind !== 'source' && targetData.kind !== 'constant';
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
}

function isUnaryOperation(
	operation: MechanicCalculationOperation | undefined
): boolean {
	return (
		operation === 'sqrt' ||
		operation === 'log' ||
		operation === 'exp' ||
		operation === 'floor' ||
		operation === 'round' ||
		operation === 'ceil'
	);
}
