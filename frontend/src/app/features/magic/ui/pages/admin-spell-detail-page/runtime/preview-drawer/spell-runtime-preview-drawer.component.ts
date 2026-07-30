import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Drawer } from 'primeng/drawer';
import { InputNumber } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import {
	SpellRuntimeEffect,
	SpellRuntimePendingChoice,
	SpellRuntimePendingRoll,
	SpellRuntimePreview,
	SpellRuntimeTraceEntry
} from '../../../../../domain/spell.models';
import {
	CommandSelectOption,
	RuntimeRollDraft,
	RuntimeTraceRow,
	TagSeverity
} from '../../models/spell-detail-page.types';

export interface SpellRuntimePreviewDrawerViewModel {
	visible: boolean;
	loading: boolean;
	error: string | null;
	preview: SpellRuntimePreview | null;
	skillLevelOptions: CommandSelectOption<number>[];
}

export interface SpellRuntimePreviewDrawerRenderers {
	rollKey(roll: SpellRuntimePendingRoll): string;
	choiceKey(choice: SpellRuntimePendingChoice): string;
	rollDraft(roll: SpellRuntimePendingRoll): RuntimeRollDraft;
	valueLabel(value: unknown): string;
	statusLabel(status: SpellRuntimePreview['status']): string;
	statusSeverity(status: SpellRuntimePreview['status']): TagSeverity;
	effectTitle(effect: SpellRuntimeEffect): string;
	effectText(effect: SpellRuntimeEffect): string;
	traceSeverity(trace: RuntimeTraceRow): TagSeverity;
	traceRows(trace: SpellRuntimeTraceEntry[]): RuntimeTraceRow[];
}

export interface SpellRuntimePreviewDrawerActions {
	setVisible(visible: boolean): void;
	rerun(): void;
	updateRollDiceCount(
		roll: SpellRuntimePendingRoll,
		diceCount: number | null
	): void;
	updateRollSkillLevel(
		roll: SpellRuntimePendingRoll,
		skillLevel: number | null
	): void;
	submitRoll(roll: SpellRuntimePendingRoll): void;
	selectChoice(choice: SpellRuntimePendingChoice, optionId: string): void;
}

@Component({
	selector: 'app-spell-runtime-preview-drawer',
	standalone: true,
	imports: [Button, Drawer, FormsModule, InputNumber, Select, Tag],
	templateUrl: './spell-runtime-preview-drawer.component.html',
	styleUrl: './spell-runtime-preview-drawer.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellRuntimePreviewDrawerComponent {
	readonly viewModel = input.required<SpellRuntimePreviewDrawerViewModel>();
	readonly renderers = input.required<SpellRuntimePreviewDrawerRenderers>();
	readonly actions = input.required<SpellRuntimePreviewDrawerActions>();
}
