import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
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

@Component({
	selector: 'app-spell-runtime-preview-drawer',
	standalone: true,
	imports: [Button, Drawer, FormsModule, InputNumber, Select, Tag],
	templateUrl: './spell-runtime-preview-drawer.component.html',
	styleUrl: './spell-runtime-preview-drawer.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellRuntimePreviewDrawerComponent {
	readonly visible = input.required<boolean>();
	readonly loading = input.required<boolean>();
	readonly error = input<string | null>(null);
	readonly preview = input<SpellRuntimePreview | null>(null);
	readonly skillLevelOptions = input.required<CommandSelectOption<number>[]>();

	readonly rollKey =
		input.required<(roll: SpellRuntimePendingRoll) => string>();
	readonly choiceKey =
		input.required<(choice: SpellRuntimePendingChoice) => string>();
	readonly rollDraft =
		input.required<(roll: SpellRuntimePendingRoll) => RuntimeRollDraft>();
	readonly valueLabel = input.required<(value: unknown) => string>();
	readonly statusLabel =
		input.required<(status: SpellRuntimePreview['status']) => string>();
	readonly statusSeverity =
		input.required<(status: SpellRuntimePreview['status']) => TagSeverity>();
	readonly effectTitle =
		input.required<(effect: SpellRuntimeEffect) => string>();
	readonly effectText =
		input.required<(effect: SpellRuntimeEffect) => string>();
	readonly traceSeverity =
		input.required<(trace: RuntimeTraceRow) => TagSeverity>();
	readonly traceRows =
		input.required<(trace: SpellRuntimeTraceEntry[]) => RuntimeTraceRow[]>();

	readonly visibleChange = output<boolean>();
	readonly rerun = output<void>();
	readonly rollDiceCountChange = output<{
		roll: SpellRuntimePendingRoll;
		diceCount: number | null;
	}>();
	readonly rollSkillLevelChange = output<{
		roll: SpellRuntimePendingRoll;
		skillLevel: number | null;
	}>();
	readonly rollSubmit = output<SpellRuntimePendingRoll>();
	readonly choiceSelect = output<{
		choice: SpellRuntimePendingChoice;
		optionId: string;
	}>();
}
