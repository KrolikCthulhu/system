import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { CustomNodeComponent, Vflow } from 'ngx-vflow';
import {
	MechanicCalculationComparison,
	MechanicCalculationGraphNodeData,
	MechanicCalculationNodeKind,
	MechanicCalculationOperation
} from '../../mechanic-calculation-graph.models';

@Component({
	selector: 'app-mechanic-calculation-graph-node',
	standalone: true,
	imports: [CommonModule, Vflow],
	template: `
		<div
			selectable
			class="mechanic-calculation-graph-node"
			[class.mechanic-calculation-graph-node--selected]="selected()"
			[class.mechanic-calculation-graph-node--source]="kind() === 'source'"
			[class.mechanic-calculation-graph-node--constant]="kind() === 'constant'"
			[class.mechanic-calculation-graph-node--operation]="kind() === 'operation'"
			[class.mechanic-calculation-graph-node--comparison]="kind() === 'comparison'"
			[class.mechanic-calculation-graph-node--condition]="kind() === 'condition'"
			[class.mechanic-calculation-graph-node--result]="kind() === 'result'"
		>
			<div class="mechanic-calculation-graph-node__card">
				<div class="mechanic-calculation-graph-node__icon" aria-hidden="true">
					<i [class]="nodeIconClass()"></i>
				</div>

				<div class="mechanic-calculation-graph-node__content">
					<div class="mechanic-calculation-graph-node__kind">
						{{ kindLabel() }}
					</div>
					<strong class="mechanic-calculation-graph-node__title">
						{{ title() }}
					</strong>
					<span class="mechanic-calculation-graph-node__subtitle">
						{{ subtitle() }}
					</span>
				</div>

				@if (kind() === 'comparison') {
					<div class="mechanic-calculation-graph-node__ports">
						<span>A {{ comparisonSymbol() }} B</span>
					</div>
				}

				@if (kind() === 'condition') {
					<div class="mechanic-calculation-graph-node__ports">
						<span>Проверка</span>
						<span>Если да</span>
						<span>Если нет</span>
					</div>
				}

				@if (kind() === 'source' || kind() === 'constant') {
					<handle type="source" position="right" id="out" />
				}

				@if (kind() === 'operation') {
					@if (usesBinaryHandles()) {
						<handle type="target" position="left" id="a" [offsetY]="12" />
						<handle type="target" position="left" id="b" [offsetY]="-12" />
					} @else {
						<handle type="target" position="left" id="in" />
					}
					<handle type="source" position="right" id="out" />
				}

				@if (kind() === 'comparison') {
					<handle type="target" position="left" id="a" [offsetY]="-10" />
					<handle type="target" position="left" id="b" [offsetY]="-30" />
					<handle type="source" position="right" id="out" />
				}

				@if (kind() === 'condition') {
					<handle type="target" position="left" id="condition" [offsetY]="-10" />
					<handle type="target" position="left" id="then" [offsetY]="-30" />
					<handle type="target" position="left" id="else" [offsetY]="-50" />
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
			.mechanic-calculation-graph-node {
				display: block;
				width: 15rem;
				padding: 0 0.375rem;
				line-height: normal;
				--node-accent: var(--p-primary-color);
				--node-accent-soft: var(--p-primary-50);
				--node-border: var(--p-content-border-color);
			}

			.mechanic-calculation-graph-node--condition {
				width: 17.5rem;
			}

			.mechanic-calculation-graph-node__card {
				position: relative;
				display: grid;
				grid-template-columns: 2.25rem minmax(0, 1fr);
				gap: 0.625rem;
				align-items: center;
				padding: 0.625rem 0.75rem 0.625rem 0.625rem;
				border: 1px solid var(--node-border);
				border-radius: 0.5rem;
				background: var(--p-content-background);
				box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
				cursor: pointer;
			}

			.mechanic-calculation-graph-node__card > handle {
				position: absolute;
			}

			.mechanic-calculation-graph-node--selected
				.mechanic-calculation-graph-node__card {
				border-color: var(--p-primary-color);
				box-shadow:
					0 1px 2px rgba(15, 23, 42, 0.04),
					inset 0 0 0 1px var(--p-primary-color);
			}

			.mechanic-calculation-graph-node__icon {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 2.25rem;
				height: 2.25rem;
				border-radius: 0.5rem;
				background: var(--node-accent-soft);
				color: var(--node-accent);
			}

			.mechanic-calculation-graph-node__content {
				display: grid;
				gap: 0.125rem;
				min-width: 0;
			}

			.mechanic-calculation-graph-node__kind {
				font-size: 0.625rem;
				font-weight: 700;
				text-transform: uppercase;
				color: var(--p-text-muted-color);
			}

			.mechanic-calculation-graph-node__title,
			.mechanic-calculation-graph-node__subtitle {
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.mechanic-calculation-graph-node__title {
				font-size: 0.875rem;
				line-height: 1.2;
				color: var(--p-text-color);
			}

			.mechanic-calculation-graph-node__subtitle {
				font-size: 0.6875rem;
				line-height: 1.3;
				color: var(--p-text-muted-color);
			}

			.mechanic-calculation-graph-node__ports {
				grid-column: 1 / -1;
				display: grid;
				gap: 0.25rem;
				padding-left: 0.75rem;
				border-left: 2px solid var(--node-accent);
				font-size: 0.6875rem;
				font-weight: 700;
				color: var(--node-accent);
			}

			.mechanic-calculation-graph-node--source {
				--node-accent: var(--p-green-600);
				--node-accent-soft: var(--p-green-100);
				--node-border: var(--p-green-200);
			}

			.mechanic-calculation-graph-node--constant {
				--node-accent: var(--p-text-muted-color);
				--node-accent-soft: var(--p-surface-100);
			}

			.mechanic-calculation-graph-node--comparison {
				--node-accent: var(--p-cyan-600);
				--node-accent-soft: var(--p-cyan-100);
				--node-border: var(--p-cyan-200);
			}

			.mechanic-calculation-graph-node--condition {
				--node-accent: var(--p-yellow-700);
				--node-accent-soft: var(--p-yellow-100);
				--node-border: var(--p-yellow-200);
			}

			.mechanic-calculation-graph-node--result {
				--node-accent: var(--p-green-600);
				--node-accent-soft: var(--p-green-100);
				--node-border: var(--p-green-200);
			}
		`
	],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class MechanicCalculationGraphNodeComponent extends CustomNodeComponent<MechanicCalculationGraphNodeData> {
	protected readonly kind = computed<MechanicCalculationNodeKind>(
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
			case 'comparison':
				return 'Сравнение';
			case 'condition':
				return 'Если';
			case 'result':
				return 'Результат';
		}
	});

	protected readonly title = computed(() => {
		const data = this.data();

		switch (this.kind()) {
			case 'source':
				return data?.sourceName ?? 'Выбери источник';
			case 'constant':
				return String(data?.constantValue ?? 0);
			case 'operation':
				return operationLabel(data?.operation ?? 'sum');
			case 'comparison':
				return comparisonLabel(data?.comparison ?? 'gte');
			case 'condition':
				return 'Выбор значения';
			case 'result':
				return 'Итог формулы';
		}
	});

	protected readonly subtitle = computed(() => {
		switch (this.kind()) {
			case 'source':
				return 'Параметр или результат шага';
			case 'constant':
				return 'Постоянное число';
			case 'operation':
				return this.usesBinaryHandles()
					? 'Два входа'
					: 'Несколько входов';
			case 'comparison':
				return 'Возвращает 1 или 0';
			case 'condition':
				return 'Если проверка не 0';
			case 'result':
				return 'Финальный выход';
		}
	});

	protected readonly usesBinaryHandles = computed(() => {
		const operation = this.data()?.operation;
		return (
			operation === 'subtract' ||
			operation === 'divide' ||
			operation === 'power'
		);
	});

	protected readonly nodeIconClass = computed(() => {
		switch (this.kind()) {
			case 'source':
				return 'pi pi-arrow-right-arrow-left';
			case 'constant':
				return 'pi pi-hashtag';
			case 'operation':
				return operationIconClass(this.data()?.operation ?? 'sum');
			case 'comparison':
				return 'pi pi-verified';
			case 'condition':
				return 'pi pi-code-branch';
			case 'result':
				return 'pi pi-flag';
		}
	});

	protected readonly comparisonSymbol = computed(() =>
		comparisonSymbol(this.data()?.comparison ?? 'gte')
	);
}

function operationIconClass(operation: MechanicCalculationOperation): string {
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
			return 'pi pi-slash';
		case 'power':
		case 'sqrt':
		case 'log':
		case 'exp':
		case 'floor':
		case 'round':
		case 'ceil':
			return 'pi pi-hashtag';
	}
}

function operationLabel(operation: MechanicCalculationOperation): string {
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
		case 'power':
			return 'Степень';
		case 'sqrt':
			return 'Корень';
		case 'log':
			return 'Логарифм';
		case 'exp':
			return 'Экспонента';
		case 'floor':
			return 'Округлить вниз';
		case 'round':
			return 'Округлить';
		case 'ceil':
			return 'Округлить вверх';
	}
}

function comparisonLabel(comparison: MechanicCalculationComparison): string {
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

function comparisonSymbol(comparison: MechanicCalculationComparison): string {
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
