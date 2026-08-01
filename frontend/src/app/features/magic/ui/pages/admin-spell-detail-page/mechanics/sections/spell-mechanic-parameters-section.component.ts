import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { SpellProgressionParameterEditorComponent } from '../../parameters/editors/spell-progression-parameter-editor.component';
import { SpellStaticParameterEditorComponent } from '../../parameters/editors/spell-static-parameter-editor.component';
import { SpellTargetParameterEditorComponent } from '../../parameters/editors/spell-target-parameter-editor.component';
import { SpellNumericParameterModeSwitchComponent } from '../../parameters/numeric-mode/spell-numeric-parameter-mode-switch.component';
import { SpellNumericParameterPreviewComponent } from '../../parameters/numeric-preview/spell-numeric-parameter-preview.component';
import { AutoHelpKey } from '../../models/spell-detail-page.types';
import { SpellMechanicParameterCardShellComponent } from '../parameter-card/spell-mechanic-parameter-card-shell.component';
import { SpellMechanicParameterCardVm } from '../view-model/spell-mechanic-parameter-card.view-model';
import { SpellMechanicAutoSectionComponent } from './spell-mechanic-auto-section.component';
import { SpellMechanicFormulaSectionComponent } from './spell-mechanic-formula-section.component';

@Component({
	selector: 'app-spell-mechanic-parameters-section',
	standalone: true,
	imports: [
		SpellMechanicAutoSectionComponent,
		SpellMechanicFormulaSectionComponent,
		SpellMechanicParameterCardShellComponent,
		SpellNumericParameterModeSwitchComponent,
		SpellNumericParameterPreviewComponent,
		SpellProgressionParameterEditorComponent,
		SpellStaticParameterEditorComponent,
		SpellTargetParameterEditorComponent
	],
	templateUrl: './spell-mechanic-parameters-section.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellMechanicParametersSectionComponent {
	readonly cards = input.required<SpellMechanicParameterCardVm[]>();
	readonly helpClick = output<{ event: MouseEvent; key: AutoHelpKey }>();
}
