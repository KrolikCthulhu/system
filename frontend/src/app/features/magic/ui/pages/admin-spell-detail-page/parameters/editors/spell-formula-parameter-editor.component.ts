import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { Button } from 'primeng/button';

@Component({
	selector: 'app-spell-formula-parameter-editor',
	standalone: true,
	imports: [Button],
	templateUrl: './spell-formula-parameter-editor.component.html',
	styleUrl: './spell-formula-parameter-editor.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellFormulaParameterEditorComponent {
	readonly openFormulaEditor = output<void>();
}
