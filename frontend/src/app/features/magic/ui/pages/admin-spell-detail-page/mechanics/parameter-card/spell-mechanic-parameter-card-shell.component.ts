import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { Tag } from 'primeng/tag';
import { SpellMechanicParameterHeaderPreview } from '../../models/spell-detail-page.types';

@Component({
	selector: 'app-spell-mechanic-parameter-card-shell',
	standalone: true,
	imports: [Tag],
	templateUrl: './spell-mechanic-parameter-card-shell.component.html',
	styleUrl: './spell-mechanic-parameter-card-shell.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellMechanicParameterCardShellComponent {
	readonly name = input.required<string>();
	readonly kindLabel = input.required<string>();
	readonly expanded = input.required<boolean>();
	readonly preview = input<SpellMechanicParameterHeaderPreview | null>(null);

	readonly expandedToggle = output<void>();
}
