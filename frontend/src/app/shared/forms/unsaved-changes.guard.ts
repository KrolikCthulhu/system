import { Injectable, inject } from '@angular/core';
import { ConfirmationService } from 'primeng/api';

interface ConfirmDiscardOptions {
	hasChanges: boolean;
	proceed: () => void;
	discard?: () => void;
	header?: string;
	message?: string;
	acceptLabel?: string;
	rejectLabel?: string;
}

@Injectable()
export class UnsavedChangesGuard {
	private readonly confirmationService = inject(ConfirmationService);

	confirmDiscard(options: ConfirmDiscardOptions) {
		if (!options.hasChanges) {
			options.proceed();
			return;
		}

		this.confirmationService.confirm({
			header: options.header ?? 'Несохранённые изменения',
			message:
				options.message ??
				'Есть несохранённые изменения. Сбросить их и продолжить?',
			icon: 'pi pi-exclamation-triangle',
			acceptLabel: options.acceptLabel ?? 'Сбросить',
			rejectLabel: options.rejectLabel ?? 'Остаться',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => {
				options.discard?.();
				options.proceed();
			}
		});
	}
}
