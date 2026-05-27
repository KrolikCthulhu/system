import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { CustomNodeComponent, Vflow } from 'ngx-vflow';
import {
	GraphNodeKind,
	GraphOperation,
	ValueGraphNodeData
} from '../../value-graph.models';

@Component({
	selector: 'app-value-graph-node',
	standalone: true,
	imports: [CommonModule, Vflow],
	template: `
		<div
			selectable
			class="value-graph-node"
			[class.value-graph-node--selected]="selected()"
			[class.value-graph-node--source]="kind() === 'source'"
			[class.value-graph-node--constant]="kind() === 'constant'"
			[class.value-graph-node--operation]="kind() === 'operation'"
			[class.value-graph-node--curve]="kind() === 'curve'"
			[class.value-graph-node--result]="kind() === 'result'"
		>
			<div class="value-graph-node__kind">{{ kindLabel() }}</div>
			<strong class="value-graph-node__title">{{ title() }}</strong>
			<span class="value-graph-node__subtitle">{{ subtitle() }}</span>

			@if (kind() === 'source') {
				<handle type="source" position="right" id="out" />
			}

			@if (kind() === 'constant') {
				<handle type="source" position="right" id="out" />
			}

			@if (kind() === 'operation') {
				@if (usesBinaryHandles()) {
					<handle type="target" position="left" id="a" style="top: 34%" />
					<handle type="target" position="left" id="b" style="top: 66%" />
				} @else {
					<handle type="target" position="left" id="in" />
				}

				<handle type="source" position="right" id="out" />
			}

			@if (kind() === 'curve') {
				<handle type="target" position="left" id="in" />
				<handle type="source" position="right" id="out" />
			}

			@if (kind() === 'result') {
				<handle type="target" position="left" id="in" />
			}
		</div>
	`,
	styles: [
		`
			.value-graph-node {
				position: relative;
				width: 14rem;
				padding: 0.75rem;
				border: 1px solid var(--p-content-border-color);
				border-radius: 0.875rem;
				background: var(--p-content-background);
				box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
				display: flex;
				flex-direction: column;
				gap: 0.25rem;
				cursor: pointer;
			}

			.value-graph-node--selected {
				border-color: var(--p-primary-color);
				box-shadow: 0 0 0 1px var(--p-primary-color);
			}

			.value-graph-node__kind {
				font-size: 0.75rem;
				font-weight: 600;
				letter-spacing: 0.08em;
				text-transform: uppercase;
				color: var(--p-text-muted-color);
			}

			.value-graph-node__title {
				font-size: 1rem;
				line-height: 1.2;
				color: var(--p-text-color);
			}

			.value-graph-node__subtitle {
				font-size: 0.875rem;
				line-height: 1.3;
				color: var(--p-text-muted-color);
			}

			.value-graph-node--source {
				background: color-mix(in srgb, var(--p-primary-50) 65%, white);
			}

			.value-graph-node--constant {
				background: color-mix(in srgb, var(--p-surface-100) 80%, white);
			}

			.value-graph-node--operation {
				background: color-mix(in srgb, var(--p-cyan-50) 75%, white);
			}

			.value-graph-node--curve {
				background: color-mix(in srgb, var(--p-orange-50) 75%, white);
			}

			.value-graph-node--result {
				background: color-mix(in srgb, var(--p-green-50) 72%, white);
			}
		`
	],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ValueGraphNodeComponent extends CustomNodeComponent<ValueGraphNodeData> {
	protected readonly kind = computed<GraphNodeKind>(
		() => this.data()?.kind ?? 'source'
	);

	protected readonly kindLabel = computed(() => {
		switch (this.kind()) {
			case 'source':
				return 'Источник';
			case 'constant':
				return 'Число';
			case 'operation':
				return 'Операция';
			case 'curve':
				return 'Шкала';
			case 'result':
				return 'Результат';
		}
	});

	protected readonly title = computed(() => {
		const data = this.data();

		switch (this.kind()) {
			case 'source':
				return data?.sourceValueName ?? 'Выбери значение';
			case 'constant':
				return String(data?.constantValue ?? 0);
			case 'operation':
				return operationLabel(data?.operation ?? 'sum');
			case 'curve':
				return 'Таблица уровней';
			case 'result':
				return 'Итоговое значение';
		}
	});

	protected readonly subtitle = computed(() => {
		const data = this.data();

		switch (this.kind()) {
			case 'source':
				return 'Значение системы';
			case 'constant':
				return 'Константа';
			case 'operation':
				return this.usesBinaryHandles()
					? 'Два входа'
					: 'Принимает несколько входов';
			case 'curve':
				return `${data?.curveRanges?.length ?? 0} диапазонов`;
			case 'result':
				return 'Финальный выход графа';
		}
	});

	protected readonly usesBinaryHandles = computed(() => {
		const operation = this.data()?.operation;
		return operation === 'subtract' || operation === 'divide';
	});
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
