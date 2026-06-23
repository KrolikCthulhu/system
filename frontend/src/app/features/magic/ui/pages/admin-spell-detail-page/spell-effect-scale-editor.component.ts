import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
	output,
	signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Tooltip } from 'primeng/tooltip';
import {
	SpellEffectScaleConfig,
	SpellEffectScaleItemConfig,
	SpellEffectScaleMode,
	SpellNestedMechanicBlockConfig
} from '../../../domain/spell.models';
import {
	SpellMechanicParameter,
	SpellMechanicParameterKind
} from '../../../../spell-mechanics/domain/spell-mechanics.models';

interface SelectOption {
	id: string;
	name: string;
	searchText: string;
}

interface SelectOptionGroup {
	label: string;
	items: SelectOption[];
}

interface CommandOption {
	label: string;
	value: string;
}

@Component({
	selector: 'app-spell-effect-scale-editor',
	standalone: true,
	imports: [
		FormsModule,
		Button,
		InputNumber,
		InputText,
		Select,
		Textarea,
		ToggleSwitch,
		Tooltip
	],
	templateUrl: './spell-effect-scale-editor.component.html',
	styleUrl: './spell-effect-scale-editor.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellEffectScaleEditorComponent {
	readonly config = input.required<SpellEffectScaleConfig>();
	readonly mechanicOptions = input.required<CommandOption[]>();
	readonly modeOptions = input.required<
		Array<{ label: string; value: SpellEffectScaleMode }>
	>();
	readonly mechanicParameters =
		input.required<(block: SpellNestedMechanicBlockConfig) => SpellMechanicParameter[]>();
	readonly usesParameterSelect =
		input.required<(kind: SpellMechanicParameterKind) => boolean>();
	readonly parameterOptions =
		input.required<(parameter: SpellMechanicParameter) => SelectOptionGroup[]>();
	readonly parameterValue =
		input.required<(block: SpellNestedMechanicBlockConfig, parameterId: string) => string>();
	readonly staticParameterValue =
		input.required<(block: SpellNestedMechanicBlockConfig, parameterId: string) => string>();

	readonly configChange = output<SpellEffectScaleConfig>();
	readonly nestedMechanicAdd = output<{ itemId: string }>();
	readonly nestedMechanicChange = output<{
		itemId: string;
		nestedBlockId: string;
		mechanicId: string;
	}>();
	readonly nestedMechanicDelete = output<{
		itemId: string;
		nestedBlockId: string;
	}>();
	readonly nestedParameterChange = output<{
		itemId: string;
		nestedBlockId: string;
		parameterId: string;
		value: unknown;
	}>();

	protected readonly selectedItemId = signal<string | null>(null);
	protected readonly selectedItem = computed(() => {
		const items = this.config().items;
		const selectedId = this.selectedItemId();

		return items.find(item => item.id === selectedId) ?? items[0] ?? null;
	});

	updateConfig(patch: Partial<SpellEffectScaleConfig>) {
		this.configChange.emit({ ...this.config(), ...patch });
	}

	addItem() {
		const items = this.config().items;
		const maxThreshold = items.reduce(
			(max, item) => Math.max(max, item.threshold),
			-1
		);
		const threshold = maxThreshold + 1;

		const nextItem: SpellEffectScaleItemConfig = {
			id: crypto.randomUUID(),
			threshold,
			name: `${threshold}+ успехов`,
			description: '',
			isOpenEnded: true,
			mechanicBlocks: []
		};

		this.updateConfig({
			items: [
				...items,
				nextItem
			]
		});
		this.selectedItemId.set(nextItem.id);
	}

	updateItem(itemId: string, patch: Partial<SpellEffectScaleItemConfig>) {
		this.updateConfig({
			items: this.config().items.map(item =>
				item.id === itemId ? { ...item, ...patch } : item
			)
		});
	}

	deleteItem(itemId: string) {
		const nextItems = this.config().items.filter(item => item.id !== itemId);

		this.updateConfig({ items: nextItems });

		if (this.selectedItemId() === itemId) {
			this.selectedItemId.set(nextItems[0]?.id ?? null);
		}
	}

	protected selectItem(itemId: string) {
		this.selectedItemId.set(itemId);
	}

	protected itemThresholdLabel(item: SpellEffectScaleItemConfig) {
		return item.isOpenEnded ? `${item.threshold}+` : `${item.threshold}`;
	}

	protected itemTitle(item: SpellEffectScaleItemConfig) {
		return item.name.trim() || `${this.itemThresholdLabel(item)} успехов`;
	}
}
