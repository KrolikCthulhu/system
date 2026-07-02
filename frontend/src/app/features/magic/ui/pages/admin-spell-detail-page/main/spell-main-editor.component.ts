import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { SpellMainEditorFacade } from './spell-main-editor.facade';

@Component({
	selector: 'app-spell-main-editor',
	standalone: true,
	imports: [
		FormsModule,
		InputNumber,
		InputText,
		Select,
		Textarea,
		ToggleSwitch
	],
	templateUrl: './spell-main-editor.component.html',
	styleUrl: './spell-main-editor.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [SpellMainEditorFacade]
})
export class SpellMainEditorComponent {
	protected readonly facade = inject(SpellMainEditorFacade);
}
