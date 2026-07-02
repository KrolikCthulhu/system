import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
	SpellEffectScaleConfig,
	SpellEffectScaleMode,
	SpellNestedMechanicBlockConfig
} from '../../../../../domain/spell.models';
import {
	SpellMechanicParameter,
	SpellMechanicParameterKind
} from '../../../../../../spell-mechanics/domain/spell-mechanics.models';
import { SpellEffectScaleEditorComponent } from './spell-effect-scale-editor.component';
import {
	CommandSelectOption,
	SpellMechanicBlockDraft
} from '../../models/spell-detail-page.types';
import { SpellParameterValue } from '../../utils/spell-numeric-parameter.utils';

interface SelectOption {
	id: string;
	name: string;
	searchText: string;
}

interface SelectOptionGroup {
	label: string;
	items: SelectOption[];
}

@Component({
	selector: 'app-spell-mechanic-effect-scale-section',
	standalone: true,
	imports: [SpellEffectScaleEditorComponent],
	templateUrl: './spell-mechanic-effect-scale-section.component.html',
	styleUrl: './spell-mechanic-effect-scale-section.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellMechanicEffectScaleSectionComponent {
	readonly block = input.required<SpellMechanicBlockDraft>();
	readonly config = input.required<SpellEffectScaleConfig>();
	readonly mechanicOptions = input.required<CommandSelectOption[]>();
	readonly modeOptions =
		input.required<Array<{ label: string; value: SpellEffectScaleMode }>>();
	readonly mechanicParameters =
		input.required<
			(block: SpellNestedMechanicBlockConfig) => SpellMechanicParameter[]
		>();
	readonly usesParameterSelect =
		input.required<(kind: SpellMechanicParameterKind) => boolean>();
	readonly parameterOptions =
		input.required<
			(parameter: SpellMechanicParameter) => SelectOptionGroup[]
		>();
	readonly parameterValue =
		input.required<
			(block: SpellNestedMechanicBlockConfig, parameterId: string) => string
		>();
	readonly staticParameterValue =
		input.required<
			(block: SpellNestedMechanicBlockConfig, parameterId: string) => string
		>();
	readonly updateConfig =
		input.required<
			(
				block: SpellMechanicBlockDraft,
				patch: Partial<SpellEffectScaleConfig>
			) => void
		>();
	readonly addNestedMechanic =
		input.required<(block: SpellMechanicBlockDraft, itemId: string) => void>();
	readonly updateNestedMechanic =
		input.required<
			(
				block: SpellMechanicBlockDraft,
				itemId: string,
				nestedBlockId: string,
				mechanicId: string
			) => void
		>();
	readonly deleteNestedMechanic =
		input.required<
			(
				block: SpellMechanicBlockDraft,
				itemId: string,
				nestedBlockId: string
			) => void
		>();
	readonly updateNestedParameter =
		input.required<
			(
				block: SpellMechanicBlockDraft,
				itemId: string,
				nestedBlockId: string,
				parameterId: string,
				value: SpellParameterValue | null
			) => void
		>();

	protected updateNestedParameterValue(event: {
		itemId: string;
		nestedBlockId: string;
		parameterId: string;
		value: unknown;
	}) {
		this.updateNestedParameter()(
			this.block(),
			event.itemId,
			event.nestedBlockId,
			event.parameterId,
			event.value as SpellParameterValue | null
		);
	}
}
