import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { SelectButton } from 'primeng/selectbutton';
import { Tag } from 'primeng/tag';
import { AutoHelpKey } from '../models/spell-detail-page.types';
import { SpellAutoParameterEditorComponent } from '../parameters/auto/spell-auto-parameter-editor.component';
import { SpellAreaDimensionVm } from './spell-area-editor.view-model';

@Component({
	selector: 'app-spell-area-dimension-section',
	standalone: true,
	imports: [
		FormsModule,
		InputText,
		SelectButton,
		Tag,
		SpellAutoParameterEditorComponent
	],
	templateUrl: './spell-area-dimension-section.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellAreaDimensionSectionComponent {
	readonly vm = input.required<SpellAreaDimensionVm>();
	readonly helpClick = output<{ event: MouseEvent; key: AutoHelpKey }>();
}
