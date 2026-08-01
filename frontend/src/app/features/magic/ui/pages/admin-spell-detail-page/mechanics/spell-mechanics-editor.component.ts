import {
	ChangeDetectionStrategy,
	Component,
	inject,
	output
} from '@angular/core';
import { AutoHelpKey } from '../models/spell-detail-page.types';
import { SpellAutoParameterFacade } from './spell-auto-parameter.facade';
import { SpellEffectScaleFacade } from './spell-effect-scale.facade';
import { SpellFormulaGraphFacade } from './spell-formula-graph.facade';
import { SpellMechanicBlocksFacade } from './spell-mechanic-blocks.facade';
import { SpellMechanicParametersFacade } from './spell-mechanic-parameters.facade';
import { SpellAutoParameterReadModel } from './read-model/spell-auto-parameter.read-model';
import { SpellMechanicParameterReadModel } from './read-model/spell-mechanic-parameter.read-model';
import { SpellMechanicsEditorViewModel } from './spell-mechanics-editor.view-model';
import { SpellAutoParameterViewModel } from './view-model/spell-auto-parameter.view-model';
import { SpellEffectScaleViewModel } from './view-model/spell-effect-scale.view-model';
import { SpellMechanicBlockListViewModel } from './view-model/spell-mechanic-block-list.view-model';
import { SpellMechanicParameterCardViewModel } from './view-model/spell-mechanic-parameter-card.view-model';
import { SpellParameterActionsViewModel } from './view-model/spell-parameter-actions.view-model';
import { SpellProgressionParameterViewModel } from './view-model/spell-progression-parameter.view-model';
import { SpellSelectedMechanicBlockViewModel } from './view-model/spell-selected-mechanic-block.view-model';
import { SpellStaticParameterViewModel } from './view-model/spell-static-parameter.view-model';
import { SpellTargetParameterViewModel } from './view-model/spell-target-parameter.view-model';
import { SpellMechanicBlockListComponent } from './block-list/spell-mechanic-block-list.component';
import { SpellMechanicBlockSummaryComponent } from './block-summary/spell-mechanic-block-summary.component';
import { SpellMechanicEffectScaleSectionComponent } from './effect-scale/spell-mechanic-effect-scale-section.component';
import { SpellMechanicParametersSectionComponent } from './sections/spell-mechanic-parameters-section.component';

@Component({
	selector: 'app-spell-mechanics-editor',
	standalone: true,
	imports: [
		SpellMechanicBlockListComponent,
		SpellMechanicBlockSummaryComponent,
		SpellMechanicEffectScaleSectionComponent,
		SpellMechanicParametersSectionComponent
	],
	templateUrl: './spell-mechanics-editor.component.html',
	styleUrl: './spell-mechanics-editor.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		SpellMechanicBlocksFacade,
		SpellMechanicParametersFacade,
		SpellAutoParameterFacade,
		SpellMechanicParameterReadModel,
		SpellAutoParameterReadModel,
		SpellEffectScaleFacade,
		SpellFormulaGraphFacade,
		SpellMechanicBlockListViewModel,
		SpellSelectedMechanicBlockViewModel,
		SpellProgressionParameterViewModel,
		SpellAutoParameterViewModel,
		SpellTargetParameterViewModel,
		SpellStaticParameterViewModel,
		SpellParameterActionsViewModel,
		SpellMechanicParameterCardViewModel,
		SpellEffectScaleViewModel,
		SpellMechanicsEditorViewModel
	]
})
export class SpellMechanicsEditorComponent {
	readonly helpClick = output<{ event: MouseEvent; key: AutoHelpKey }>();

	protected readonly vm = inject(SpellMechanicsEditorViewModel);
}
