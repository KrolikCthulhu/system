import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SpellFormulaParameterEditorComponent } from '../../parameters/editors/spell-formula-parameter-editor.component';
import { SpellMechanicParameterCardVm } from '../view-model/spell-mechanic-parameter-card.view-model';

@Component({
	selector: 'app-spell-mechanic-formula-section',
	standalone: true,
	imports: [SpellFormulaParameterEditorComponent],
	templateUrl: './spell-mechanic-formula-section.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellMechanicFormulaSectionComponent {
	readonly card = input.required<SpellMechanicParameterCardVm>();
}
