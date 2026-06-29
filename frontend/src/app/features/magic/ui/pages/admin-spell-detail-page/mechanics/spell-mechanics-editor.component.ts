import {
	ChangeDetectionStrategy,
	Component,
	inject,
	input,
	output
} from '@angular/core';
import { SpellMechanicParameter } from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import { SpellTargetConfigEditorValue } from '../../../../../../shared/ui/spell-target-config-editor/spell-target-config-editor.component';
import { TargetTemplateId } from '../utils/spell-target-config.utils';
import {
	ProgressionSourceKind,
	SpellAutoParameterSource,
	SpellAutoParameterValue
} from '../utils/spell-numeric-parameter.utils';
import {
	AutoHelpKey,
	CommandSelectOption,
	CommandSelectOptionGroup,
	SpellMechanicBlockDraft,
	SpellMechanicBlockListItem
} from '../models/spell-detail-page.types';
import { SpellMechanicsEditorFacade } from './spell-mechanics-editor.facade';
import { SpellAutoParameterEditorComponent } from '../parameters/auto/spell-auto-parameter-editor.component';
import { SpellFormulaParameterEditorComponent } from '../parameters/editors/spell-formula-parameter-editor.component';
import { SpellMechanicBlockListComponent } from './block-list/spell-mechanic-block-list.component';
import { SpellMechanicBlockSummaryComponent } from './block-summary/spell-mechanic-block-summary.component';
import { SpellMechanicEffectScaleSectionComponent } from './effect-scale/spell-mechanic-effect-scale-section.component';
import { SpellMechanicParameterCardShellComponent } from './parameter-card/spell-mechanic-parameter-card-shell.component';
import { SpellNumericParameterModeSwitchComponent } from '../parameters/numeric-mode/spell-numeric-parameter-mode-switch.component';
import { SpellNumericParameterPreviewComponent } from '../parameters/numeric-preview/spell-numeric-parameter-preview.component';
import { SpellProgressionParameterEditorComponent } from '../parameters/editors/spell-progression-parameter-editor.component';
import { SpellStaticParameterEditorComponent } from '../parameters/editors/spell-static-parameter-editor.component';
import { SpellTargetParameterEditorComponent } from '../parameters/editors/spell-target-parameter-editor.component';

export interface SpellMechanicsEditorContext {
	autoValueRangeModeOptions: CommandSelectOption<
		SpellAutoParameterValue['rangeMode']
	>[];
	updateSelectedProgressionSourceKind: (
		block: SpellMechanicBlockDraft,
		parameterId: string,
		sourceKind: ProgressionSourceKind
	) => void;
	autoTransformSourceOptionsRenderer: (
		value: SpellAutoParameterValue,
		source: SpellAutoParameterSource
	) => CommandSelectOptionGroup[];
	updateMechanicTargetTemplate: (
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter,
		templateId: TargetTemplateId
	) => void;
	updateMechanicTargetConfig: (
		block: SpellMechanicBlockDraft,
		parameterId: string,
		config: Partial<SpellTargetConfigEditorValue>
	) => void;
}

@Component({
	selector: 'app-spell-mechanics-editor',
	standalone: true,
	imports: [
		SpellAutoParameterEditorComponent,
		SpellFormulaParameterEditorComponent,
		SpellMechanicBlockListComponent,
		SpellMechanicBlockSummaryComponent,
		SpellMechanicEffectScaleSectionComponent,
		SpellMechanicParameterCardShellComponent,
		SpellNumericParameterModeSwitchComponent,
		SpellNumericParameterPreviewComponent,
		SpellProgressionParameterEditorComponent,
		SpellStaticParameterEditorComponent,
		SpellTargetParameterEditorComponent
	],
	templateUrl: './spell-mechanics-editor.component.html',
	styleUrl: './spell-mechanics-editor.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [SpellMechanicsEditorFacade]
})
export class SpellMechanicsEditorComponent {
	readonly context = input.required<SpellMechanicsEditorContext>();

	readonly helpClick = output<{ event: MouseEvent; key: AutoHelpKey }>();

	protected readonly facade = inject(SpellMechanicsEditorFacade);

	protected blockListItems(): SpellMechanicBlockListItem[] {
		const blocks = this.facade.draft()?.mechanicBlocks ?? [];

		return blocks.map((block, index) => ({
			id: block.id,
			index,
			name: this.facade.mechanicName(block),
			preview: this.facade.mechanicBlockTextPreview(block),
			invalid: this.facade.isMechanicBlockInvalid(block),
			first: index === 0,
			last: index === blocks.length - 1
		}));
	}
}
