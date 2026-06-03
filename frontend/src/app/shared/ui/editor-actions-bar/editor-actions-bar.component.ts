import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from 'primeng/button';

@Component({
	selector: 'app-editor-actions-bar',
	standalone: true,
	imports: [Button],
	templateUrl: './editor-actions-bar.component.html',
	styleUrl: './editor-actions-bar.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditorActionsBarComponent {
	readonly hasChanges = input(false);
	readonly saving = input(false);
	readonly disabled = input(false);
	readonly resetLabel = input('Сбросить');
	readonly saveLabel = input('Сохранить');
	readonly resetDisabled = input<boolean | null>(null);
	readonly saveDisabled = input<boolean | null>(null);

	readonly reset = output<void>();
	readonly save = output<void>();

	protected get isResetDisabled() {
		const explicit = this.resetDisabled();
		if (explicit !== null) {
			return explicit;
		}

		return this.disabled() || this.saving() || !this.hasChanges();
	}

	protected get isSaveDisabled() {
		const explicit = this.saveDisabled();
		if (explicit !== null) {
			return explicit;
		}

		return this.disabled() || !this.hasChanges();
	}
}
