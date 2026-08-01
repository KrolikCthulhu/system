import {
	ChangeDetectionStrategy,
	Component,
	inject,
	output
} from '@angular/core';
import { Tag } from 'primeng/tag';
import { AutoHelpKey } from '../models/spell-detail-page.types';
import { SpellAreaDimensionSectionComponent } from './spell-area-dimension-section.component';
import { SpellAreaEditorFacade } from './spell-area-editor.facade';
import { SpellAreaEditorViewModel } from './spell-area-editor.view-model';

@Component({
	selector: 'app-spell-area-editor',
	standalone: true,
	imports: [Tag, SpellAreaDimensionSectionComponent],
	templateUrl: './spell-area-editor.component.html',
	styleUrl: './spell-area-editor.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [SpellAreaEditorFacade, SpellAreaEditorViewModel]
})
export class SpellAreaEditorComponent {
	readonly helpClick = output<{ event: MouseEvent; key: AutoHelpKey }>();

	protected readonly vm = inject(SpellAreaEditorViewModel);
}
