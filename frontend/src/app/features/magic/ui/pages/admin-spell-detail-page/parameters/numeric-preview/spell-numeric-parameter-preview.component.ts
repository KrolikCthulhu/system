import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { NumericParameterPreview } from '../../utils/spell-numeric-parameter.utils';
import { CasterLevelMatrixPreview } from '../../models/spell-detail-page.types';

@Component({
	selector: 'app-spell-numeric-parameter-preview',
	standalone: true,
	templateUrl: './spell-numeric-parameter-preview.component.html',
	styleUrl: './spell-numeric-parameter-preview.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellNumericParameterPreviewComponent {
	readonly preview = input.required<NumericParameterPreview>();
	readonly casterLevelMatrix = input<CasterLevelMatrixPreview | null>(null);
	readonly casterLevelMatrixExpanded = input(false);

	readonly casterLevelMatrixToggle = output<void>();
}
