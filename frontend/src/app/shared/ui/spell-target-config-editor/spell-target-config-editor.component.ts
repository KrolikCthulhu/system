import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';

export type SpellTargetConfigEditorSource = 'caster' | 'selected' | 'area';
export type SpellTargetConfigEditorRelation = 'self' | 'any' | 'enemy' | 'ally';
export type SpellTargetConfigEditorCountMode = 'one' | 'all' | 'upTo' | 'exact';
export type SpellTargetConfigEditorCountValueMode = 'fixed' | 'formula' | 'parameter';

export interface SpellTargetConfigEditorCountParameterOption {
	label: string;
	value: string;
}

export interface SpellTargetConfigEditorValue {
	name: string;
	source: SpellTargetConfigEditorSource;
	relation: SpellTargetConfigEditorRelation;
	countMode: SpellTargetConfigEditorCountMode;
	countValueMode: SpellTargetConfigEditorCountValueMode;
	countValue: number;
	countFormula: string;
	targetCountParameterId: string;
	isRequired: boolean;
}

@Component({
	selector: 'app-spell-target-config-editor',
	standalone: true,
	imports: [FormsModule, InputNumber, InputText, Select, ToggleSwitch],
	templateUrl: './spell-target-config-editor.component.html',
	styleUrl: './spell-target-config-editor.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellTargetConfigEditorComponent {
	readonly value = input.required<SpellTargetConfigEditorValue>();
	readonly requiredLabel = input('Обязательная цель');
	readonly countParameterOptions = input<
		SpellTargetConfigEditorCountParameterOption[]
	>([]);
	readonly valueChange = output<Partial<SpellTargetConfigEditorValue>>();

	protected readonly targetSourceOptions: Array<{
		label: string;
		value: SpellTargetConfigEditorSource;
	}> = [
		{ label: 'Сам кастер', value: 'caster' },
		{ label: 'Выбрать вручную', value: 'selected' },
		{ label: 'В области', value: 'area' }
	];
	protected readonly targetRelationOptions: Array<{
		label: string;
		value: SpellTargetConfigEditorRelation;
	}> = [
		{ label: 'Сам', value: 'self' },
		{ label: 'Любые', value: 'any' },
		{ label: 'Враги', value: 'enemy' },
		{ label: 'Союзники', value: 'ally' }
	];
	protected readonly targetCountModeOptions: Array<{
		label: string;
		value: SpellTargetConfigEditorCountMode;
	}> = [
		{ label: 'Одна', value: 'one' },
		{ label: 'Все', value: 'all' },
		{ label: 'До значения', value: 'upTo' },
		{ label: 'Ровно значение', value: 'exact' }
	];
	protected readonly targetCountValueModeOptions: Array<{
		label: string;
		value: SpellTargetConfigEditorCountValueMode;
	}> = [
		{ label: 'Число', value: 'fixed' },
		{ label: 'Формула', value: 'formula' },
		{ label: 'Из параметра', value: 'parameter' }
	];

	protected updateValue(patch: Partial<SpellTargetConfigEditorValue>) {
		this.valueChange.emit(patch);
	}
}
