import {
	ChangeDetectionStrategy,
	Component,
	input,
	output
} from '@angular/core';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';

@Component({
	selector: 'app-spell-detail-editor-header',
	standalone: true,
	imports: [Button, Tag],
	templateUrl: './spell-detail-editor-header.component.html',
	styleUrl: './spell-detail-editor-header.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellDetailEditorHeaderComponent {
	readonly title = input.required<string>();
	readonly formulaName = input.required<string>();
	readonly statusLabel = input.required<string>();
	readonly statusSeverity = input<
		'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'
	>('secondary');
	readonly canRunPreview = input(false);
	readonly canDelete = input(false);

	readonly runPreview = output<void>();
	readonly deleteSpell = output<void>();
}
