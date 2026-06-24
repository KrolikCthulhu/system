import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';

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
	selector: 'app-spell-static-parameter-editor',
	standalone: true,
	imports: [FormsModule, InputText, Select],
	templateUrl: './spell-static-parameter-editor.component.html',
	styleUrl: './spell-static-parameter-editor.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellStaticParameterEditorComponent {
	readonly showValueLabel = input(false);
	readonly usesSelect = input.required<boolean>();
	readonly options = input<SelectOptionGroup[]>([]);
	readonly selectValue = input<string | null>(null);
	readonly plainValue = input('');

	readonly selectValueChange = output<string | null>();
	readonly plainValueChange = output<string>();
}
