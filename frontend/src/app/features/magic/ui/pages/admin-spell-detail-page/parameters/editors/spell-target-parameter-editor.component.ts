import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import {
	SpellTargetConfigEditorComponent,
	SpellTargetConfigEditorValue
} from '../../../../../../../shared/ui/spell-target-config-editor/spell-target-config-editor.component';
import { SpellTargetConfig } from '../../../../../domain/spell.models';
import {
	TargetTemplateId,
	TargetTemplateOptionGroup
} from '../../utils/spell-target-config.utils';

interface CommandSelectOption {
	label: string;
	value: string;
}

@Component({
	selector: 'app-spell-target-parameter-editor',
	standalone: true,
	imports: [FormsModule, Select, SpellTargetConfigEditorComponent],
	templateUrl: './spell-target-parameter-editor.component.html',
	styleUrl: './spell-target-parameter-editor.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellTargetParameterEditorComponent {
	readonly templateOptions = input.required<TargetTemplateOptionGroup[]>();
	readonly template = input.required<TargetTemplateId>();
	readonly previewText = input.required<string>();
	readonly runtimeSummary = input.required<string>();
	readonly defaultText = input<string | null>(null);
	readonly config = input<SpellTargetConfig | null>(null);
	readonly countParameterOptions = input<CommandSelectOption[]>([]);

	readonly templateChange = output<TargetTemplateId>();
	readonly configChange = output<Partial<SpellTargetConfigEditorValue>>();
}
