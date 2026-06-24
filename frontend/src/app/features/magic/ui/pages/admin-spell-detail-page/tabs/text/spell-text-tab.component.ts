import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import {
	SpellEffectScaleItemConfig,
	SpellTextBlock,
	SpellTextBlockKind
} from '../../../../../domain/spell.models';
import {
	SpellTextPreviewMode,
	SpellTextPreviewPart
} from '../../models/spell-detail-page.types';

interface SpellTextPreviewModeOption {
	label: string;
	value: SpellTextPreviewMode;
}

interface SpellTextBlockKindOption {
	label: string;
	value: SpellTextBlockKind;
}

interface SpellTextMechanicOption {
	label: string;
	value: string;
}

@Component({
	selector: 'app-spell-text-tab',
	standalone: true,
	imports: [Button, FormsModule, Select, SelectButton, Textarea, ToggleSwitch],
	templateUrl: './spell-text-tab.component.html',
	styleUrl: './spell-text-tab.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellTextTabComponent {
	readonly previewModeOptions = input.required<SpellTextPreviewModeOption[]>();
	readonly previewMode = input.required<SpellTextPreviewMode>();
	readonly previewParts = input.required<SpellTextPreviewPart[]>();
	readonly textBlocks = input.required<SpellTextBlock[]>();
	readonly blockKindOptions = input.required<SpellTextBlockKindOption[]>();
	readonly mechanicOptions = input.required<SpellTextMechanicOption[]>();

	readonly previewModeChange = output<SpellTextPreviewMode>();
	readonly addTextBlock = output<SpellTextBlockKind>();
	readonly syncFromMechanics = output<void>();
	readonly updateTextBlock = output<{
		blockId: string;
		patch: Partial<SpellTextBlock>;
	}>();
	readonly deleteTextBlock = output<string>();
	readonly moveTextBlock = output<{ index: number; direction: -1 | 1 }>();

	readonly blockPreview = input.required<(block: SpellTextBlock) => string>();
	readonly effectScaleRequirementText =
		input.required<(item: SpellEffectScaleItemConfig) => string>();

	protected isFirstBlock(index: number) {
		return index === 0;
	}

	protected isLastBlock(index: number) {
		return index === this.textBlocks().length - 1;
	}
}
