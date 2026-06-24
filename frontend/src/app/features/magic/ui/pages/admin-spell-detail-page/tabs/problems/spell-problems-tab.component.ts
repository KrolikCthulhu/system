import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { Button } from 'primeng/button';
import { MechanicProblemItem } from '../../models/spell-detail-page.types';

@Component({
	selector: 'app-spell-problems-tab',
	standalone: true,
	imports: [Button],
	templateUrl: './spell-problems-tab.component.html',
	styleUrl: './spell-problems-tab.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellProblemsTabComponent {
	readonly problems = input.required<MechanicProblemItem[]>();

	readonly selectProblem = output<MechanicProblemItem>();
}
