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
			<div class="value-graph-node__card">
				<div class="value-graph-node__icon" aria-hidden="true">
					@if (usesDivideIcon()) {
						<svg
							class="value-graph-node__svg-icon"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							focusable="false"
						>
							<path d="M12 7.25a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
							<path d="M5 10.5a1.5 1.5 0 0 0 0 3h14a1.5 1.5 0 0 0 0-3H5Z" />
							<path d="M12 20.75a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
						</svg>
					} @else {
						<i [class]="nodeIconClass()"></i>
					}
				</div>

				<div class="value-graph-node__content">
					<div class="value-graph-node__kind">{{ kindLabel() }}</div>
					<strong class="value-graph-node__title">{{ title() }}</strong>
					<span class="value-graph-node__subtitle">{{ subtitle() }}</span>
				</div>

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
		</div>
	`,
	styles: [
		`
			.value-graph-node {
				display: block;
				width: 15rem;
				padding: 0 0.375rem;
				line-height: normal;
				--node-accent: var(--p-primary-color);
				--node-accent-soft: var(--p-primary-50);
				--node-border: var(--p-content-border-color);
			}

			.value-graph-node__card {
				position: relative;
				display: grid;
				grid-template-columns: 2.5rem minmax(0, 1fr);
				gap: 0.75rem;
				align-items: center;
				padding: 0.625rem 0.75rem 0.625rem 0.625rem;
				border: 1px solid var(--node-border);
				border-radius: 0.5rem;
				background: var(--p-content-background);
				box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
				cursor: pointer;
			}

			.value-graph-node__card > handle {
				position: absolute;
			}

			.value-graph-node--selected .value-graph-node__card {
				border-color: var(--p-primary-color);
				box-shadow:
					0 1px 2px rgba(15, 23, 42, 0.04),
					inset 0 0 0 1px var(--p-primary-color);
			}

			.value-graph-node__icon {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 2.5rem;
				height: 2.5rem;
				border-radius: 0.5rem;
				background: var(--node-accent-soft);
				color: var(--node-accent);
			}

			.value-graph-node__icon .pi {
				font-size: 1rem;
			}

			.value-graph-node__svg-icon {
				display: block;
				width: 1.125rem;
				height: 1.125rem;
				fill: currentColor;
			}

			.value-graph-node__content {
				display: grid;
				gap: 0.125rem;
				min-width: 0;
			}

			.value-graph-node__kind {
				font-size: 0.625rem;
				font-weight: 700;
				letter-spacing: 0.06em;
				text-transform: uppercase;
				color: var(--p-text-muted-color);
			}

			.value-graph-node__title {
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				font-size: 0.875rem;
				line-height: 1.2;
				color: var(--p-text-color);
			}

			.value-graph-node__subtitle {
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				font-size: 0.6875rem;
				line-height: 1.3;
				color: var(--p-text-muted-color);
			}

			.value-graph-node--source {
				--node-accent: var(--p-green-600);
				--node-accent-soft: var(--p-green-100);
				--node-border: var(--p-green-200);
			}

			.value-graph-node--constant {
				--node-accent: var(--p-text-muted-color);
				--node-accent-soft: var(--p-surface-100);
				--node-border: var(--p-content-border-color);
			}

			.value-graph-node--operation {
				--node-accent: var(--p-primary-color);
				--node-accent-soft: var(--p-primary-50);
				--node-border: color-mix(
					in srgb,
					var(--p-primary-color) 45%,
					var(--p-content-border-color)
				);
			}

			.value-graph-node--curve {
				--node-accent: var(--p-orange-600);
				--node-accent-soft: var(--p-orange-100);
				--node-border: var(--p-orange-200);
			}

			.value-graph-node--result {
				--node-accent: var(--p-green-600);
				--node-accent-soft: var(--p-green-100);
				--node-border: var(--p-green-200);
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

	protected readonly nodeIconClass = computed(() => {
		switch (this.kind()) {
			case 'source':
				return 'pi pi-chart-bar';
			case 'constant':
				return 'pi pi-hashtag';
			case 'operation':
				return operationIconClass(this.data()?.operation ?? 'sum');
			case 'curve':
				return 'pi pi-sliders-h';
			case 'result':
				return 'pi pi-flag';
		}
	});

	protected readonly usesDivideIcon = computed(
		() => this.kind() === 'operation' && this.data()?.operation === 'divide'
	);
}

function operationIconClass(operation: GraphOperation): string {
	switch (operation) {
		case 'sum':
			return 'pi pi-plus';
		case 'average':
			return 'pi pi-percentage';
		case 'min':
			return 'pi pi-angle-down';
		case 'max':
			return 'pi pi-angle-up';
		case 'multiply':
			return 'pi pi-times';
		case 'subtract':
			return 'pi pi-minus';
		case 'divide':
			return '';
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
