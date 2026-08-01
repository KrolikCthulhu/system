import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { SpellAutoParameterEditorComponent } from '../../parameters/auto/spell-auto-parameter-editor.component';
import { AutoHelpKey } from '../../models/spell-detail-page.types';
import { SpellMechanicParameterCardVm } from '../view-model/spell-mechanic-parameter-card.view-model';

@Component({
	selector: 'app-spell-mechanic-auto-section',
	standalone: true,
	imports: [SpellAutoParameterEditorComponent],
	templateUrl: './spell-mechanic-auto-section.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellMechanicAutoSectionComponent {
	readonly card = input.required<SpellMechanicParameterCardVm>();
	readonly helpClick = output<{ event: MouseEvent; key: AutoHelpKey }>();
}
