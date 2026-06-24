import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { Button } from 'primeng/button';
import { SpellMechanicBlockListItem } from '../../models/spell-detail-page.types';

@Component({
	selector: 'app-spell-mechanic-block-list',
	standalone: true,
	imports: [Button],
	templateUrl: './spell-mechanic-block-list.component.html',
	styleUrl: './spell-mechanic-block-list.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellMechanicBlockListComponent {
	readonly items = input.required<SpellMechanicBlockListItem[]>();
	readonly selectedIndex = input<number | null>(null);

	readonly addMechanic = output<void>();
	readonly selectMechanic = output<number>();
	readonly moveMechanic = output<{ index: number; direction: -1 | 1 }>();
}
