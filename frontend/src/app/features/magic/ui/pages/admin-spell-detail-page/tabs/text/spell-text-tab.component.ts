import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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

export interface SpellTextTabViewModel {
	previewModeOptions: SpellTextPreviewModeOption[];
	previewMode: SpellTextPreviewMode;
	previewParts: SpellTextPreviewPart[];
	textBlocks: SpellTextBlock[];
	blockKindOptions: SpellTextBlockKindOption[];
	mechanicOptions: SpellTextMechanicOption[];
	blockPreview(block: SpellTextBlock): string;
	effectScaleRequirementText(item: SpellEffectScaleItemConfig): string;
}

export interface SpellTextTabActions {
	updatePreviewMode(mode: SpellTextPreviewMode): void;
	addTextBlock(kind: SpellTextBlockKind): void;
	syncFromMechanics(): void;
	updateTextBlock(blockId: string, patch: Partial<SpellTextBlock>): void;
	deleteTextBlock(blockId: string): void;
	moveTextBlock(index: number, direction: -1 | 1): void;
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
	readonly viewModel = input.required<SpellTextTabViewModel>();
	readonly actions = input.required<SpellTextTabActions>();

	protected isFirstBlock(index: number) {
		return index === 0;
	}

	protected isLastBlock(index: number) {
		return index === this.viewModel().textBlocks.length - 1;
	}
}
