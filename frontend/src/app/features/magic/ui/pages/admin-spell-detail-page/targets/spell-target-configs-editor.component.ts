import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Button } from 'primeng/button';
import { SpellTargetConfigEditorComponent } from '../../../../../../shared/ui/spell-target-config-editor/spell-target-config-editor.component';
import { SpellTargetConfigsEditorFacade } from './spell-target-configs-editor.facade';

@Component({
	selector: 'app-spell-target-configs-editor',
	standalone: true,
	imports: [Button, SpellTargetConfigEditorComponent],
	templateUrl: './spell-target-configs-editor.component.html',
	styleUrl: './spell-target-configs-editor.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [SpellTargetConfigsEditorFacade]
})
export class SpellTargetConfigsEditorComponent {
	protected readonly facade = inject(SpellTargetConfigsEditorFacade);
}
