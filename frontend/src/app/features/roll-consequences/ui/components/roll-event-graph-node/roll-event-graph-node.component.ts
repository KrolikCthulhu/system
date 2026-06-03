import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { CustomNodeComponent, Vflow } from 'ngx-vflow';
import {
	RollEventGraphComparison,
	RollEventGraphNodeData,
	RollEventGraphOperation
} from '../../../domain/roll-event-graph.models';

@Component({
	selector: 'app-roll-event-graph-node',
	standalone: true,
	imports: [CommonModule, Vflow],
	template: `
		<div
			selectable
			class="roll-event-node"
			[class.roll-event-node--selected]="selected()"
			[class.roll-event-node--event-input]="kind() === 'eventInput'"
			[class.roll-event-node--value-source]="kind() === 'valueSource'"
			[class.roll-event-node--constant]="kind() === 'constant'"
			[class.roll-event-node--operation]="kind() === 'operation'"
			[class.roll-event-node--comparison]="kind() === 'comparison'"
			[class.roll-event-node--condition]="kind() === 'condition'"
			[class.roll-event-node--threshold-counter]="kind() === 'thresholdCounter'"
			[class.roll-event-node--write-value]="kind() === 'writeValue'"
		>
			<div class="roll-event-node__card">
				<div class="roll-event-node__icon" aria-hidden="true">
					<i [class]="iconClass()"></i>
				</div>

				<div class="roll-event-node__content">
					<div class="roll-event-node__kind">{{ kindLabel() }}</div>
					<strong class="roll-event-node__title">{{ title() }}</strong>
					<span class="roll-event-node__subtitle">{{ subtitle() }}</span>
				</div>

				@if (kind() === 'comparison') {
					<div class="roll-event-node__map">
						<div><b>A</b><span>левое значение</span></div>
						<div><b>B</b><span>правое значение</span></div>
						<strong>A {{ comparisonSymbol() }} B</strong>
					</div>
				}

				@if (kind() === 'condition') {
					<div class="roll-event-node__map">
						<div><b>Проверка</b><span>если не 0</span></div>
						<div><b>Если да</b><span>значение при истине</span></div>
						<div><b>Если нет</b><span>значение при лжи</span></div>
					</div>
				}

				@if (kind() === 'thresholdCounter') {
					<div class="roll-event-node__map">
						<div><b>Добавить</b><span>прирост накопителя</span></div>
						<div><b>Накопитель</b><span>{{ data()?.accumulatorValueName ?? 'не выбрано' }}</span></div>
						<div><b>Порог</b><span>{{ data()?.thresholdValueName ?? 'не выбрано' }}</span></div>
						<div><b>Переполнение</b><span>{{ data()?.overflowValueName ?? 'не выбрано' }}</span></div>
						<div><b>Режим</b><span>{{ overflowModeLabel() }}</span></div>
					</div>
				}

				@if (kind() === 'eventInput' || kind() === 'valueSource' || kind() === 'constant') {
					<handle type="source" position="right" id="out" />
				}

				@if (kind() === 'operation') {
					<handle type="target" position="left" id="in" />
					<handle type="source" position="right" id="out" />
				}

				@if (kind() === 'comparison') {
					<handle type="target" position="left" id="a" [offsetY]="-10" />
					<handle type="target" position="left" id="b" [offsetY]="-31" />
					<handle type="source" position="right" id="out" />
				}

				@if (kind() === 'condition') {
					<handle type="target" position="left" id="condition" [offsetY]="-12" />
					<handle type="target" position="left" id="then" [offsetY]="-32" />
					<handle type="target" position="left" id="else" [offsetY]="-52" />
					<handle type="source" position="right" id="out" />
				}

				@if (kind() === 'writeValue') {
					<handle type="target" position="left" id="value" />
				}

				@if (kind() === 'thresholdCounter') {
					<handle type="target" position="left" id="increment" />
				}
			</div>
		</div>
	`,
	styles: [
		`
			.roll-event-node {
				display: block;
				width: 16rem;
				padding: 0 0.375rem;
				line-height: normal;
				--node-accent: var(--p-primary-color);
				--node-accent-soft: var(--p-primary-50);
				--node-border: var(--p-content-border-color);
			}

			.roll-event-node--condition {
				width: 19rem;
			}

			.roll-event-node--threshold-counter {
				width: 21rem;
			}

			.roll-event-node__card {
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

			.roll-event-node__card > handle {
				position: absolute;
			}

			.roll-event-node--selected .roll-event-node__card {
				border-color: var(--p-primary-color);
				box-shadow:
					0 1px 2px rgba(15, 23, 42, 0.04),
					inset 0 0 0 1px var(--p-primary-color);
			}

			.roll-event-node__icon {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 2.5rem;
				height: 2.5rem;
				border-radius: 0.5rem;
				background: var(--node-accent-soft);
				color: var(--node-accent);
			}

			.roll-event-node__content {
				min-width: 0;
			}

			.roll-event-node__kind {
				color: var(--p-text-muted-color);
				font-size: 0.625rem;
				font-weight: 800;
				text-transform: uppercase;
				letter-spacing: 0.08em;
			}

			.roll-event-node__title,
			.roll-event-node__subtitle {
				display: block;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.roll-event-node__title {
				color: var(--p-text-color);
				font-size: 0.9375rem;
			}

			.roll-event-node__subtitle {
				margin-top: 0.125rem;
				color: var(--p-text-muted-color);
				font-size: 0.75rem;
			}

			.roll-event-node__map {
				grid-column: 1 / -1;
				display: flex;
				flex-direction: column;
				gap: 0.25rem;
				padding-left: 0.25rem;
				color: var(--node-accent);
				font-size: 0.75rem;
				font-weight: 400;
			}

			.roll-event-node__map div {
				display: grid;
				grid-template-columns: 5rem minmax(0, 1fr);
				gap: 0.5rem;
				align-items: center;
			}

			.roll-event-node__map span {
				color: var(--p-text-muted-color);
				font-weight: 400;
			}

			.roll-event-node__map b {
				font-weight: 500;
			}

			.roll-event-node--event-input {
				--node-accent: var(--p-blue-500);
				--node-accent-soft: var(--p-blue-50);
			}

			.roll-event-node--value-source {
				--node-accent: var(--p-green-500);
				--node-accent-soft: var(--p-green-50);
			}

			.roll-event-node--write-value {
				--node-accent: var(--p-red-500);
				--node-accent-soft: var(--p-red-50);
			}

			.roll-event-node--comparison {
				--node-accent: var(--p-cyan-600);
				--node-accent-soft: var(--p-cyan-50);
			}

			.roll-event-node--condition {
				--node-accent: var(--p-amber-600);
				--node-accent-soft: var(--p-yellow-50);
			}

			.roll-event-node--threshold-counter {
				--node-accent: var(--p-orange-600);
				--node-accent-soft: var(--p-orange-50);
			}
		`
	],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class RollEventGraphNodeComponent extends CustomNodeComponent<RollEventGraphNodeData> {
	protected readonly kind = computed(() => this.data()?.kind ?? 'constant');

	protected kindLabel() {
		switch (this.kind()) {
			case 'eventInput':
				return 'Событие';
			case 'valueSource':
				return 'Значение';
			case 'constant':
				return 'Число';
			case 'operation':
				return 'Операция';
			case 'comparison':
				return 'Сравнение';
			case 'condition':
				return 'Если';
			case 'thresholdCounter':
				return 'Накопитель';
			case 'writeValue':
				return 'Запись';
		}
	}

	protected title() {
		const data = this.data();

		switch (this.kind()) {
			case 'eventInput':
				return eventInputLabel(data?.eventInputKey);
			case 'valueSource':
				return data?.sourceValueName ?? 'Выбери значение';
			case 'constant':
				return String(data?.constantValue ?? 0);
			case 'operation':
				return operationLabel(data?.operation);
			case 'comparison':
				return comparisonLabel(data?.comparison);
			case 'condition':
				return 'Выбор значения';
			case 'thresholdCounter':
				return 'Накопитель с порогом';
			case 'writeValue':
				return data?.targetValueName ?? 'Куда записать';
		}
	}

	protected subtitle() {
		switch (this.kind()) {
			case 'eventInput':
				return 'Из данных броска';
			case 'valueSource':
				return 'Текущее значение системы';
			case 'constant':
				return 'Константа';
			case 'operation':
				return 'Возвращает число';
			case 'comparison':
				return 'Возвращает 1 или 0';
			case 'condition':
				return 'Если проверка не 0';
			case 'thresholdCounter':
				return 'Добавляет, проверяет порог и применяет переполнение';
			case 'writeValue':
				return 'Изменяет значение системы';
		}
	}

	protected iconClass() {
		switch (this.kind()) {
			case 'eventInput':
				return 'pi pi-send';
			case 'valueSource':
				return 'pi pi-database';
			case 'constant':
				return 'pi pi-hashtag';
			case 'operation':
				return 'pi pi-plus';
			case 'comparison':
				return 'pi pi-check-circle';
			case 'condition':
				return 'pi pi-code-branch';
			case 'thresholdCounter':
				return 'pi pi-sync';
			case 'writeValue':
				return 'pi pi-pencil';
		}
	}

	protected comparisonSymbol() {
		switch (this.data()?.comparison ?? 'gte') {
			case 'eq':
				return '=';
			case 'ne':
				return '≠';
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

	protected overflowModeLabel() {
		return this.data()?.overflowMode === 'multiple'
			? 'за каждый порог'
			: 'один раз';
	}
}

function eventInputLabel(key: RollEventGraphNodeData['eventInputKey']) {
	switch (key) {
		case 'diceCount':
			return 'Количество кубов';
		case 'successes':
			return 'Успехи';
		case 'sixes':
			return 'Выпавшие шестерки';
		case 'ones':
			return 'Выпавшие единицы';
		case 'ignoredOnes':
			return 'Игнорированные единицы';
		case 'consequenceCount':
			return 'Количество последствий';
		case 'skillLevel':
			return 'Уровень навыка';
		default:
			return 'Количество последствий';
	}
}

function operationLabel(operation: RollEventGraphOperation | undefined) {
	switch (operation ?? 'sum') {
		case 'sum':
			return 'Сложить';
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

function comparisonLabel(comparison: RollEventGraphComparison | undefined) {
	switch (comparison ?? 'gte') {
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
