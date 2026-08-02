import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	computed,
	inject,
	signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Breadcrumb } from 'primeng/breadcrumb';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { SYSTEM_COMBAT_ACTIONS_REPOSITORY } from '../../../data/system-combat-actions-repository.port';
import { SystemCombatAction } from '../../../domain/system-combat-actions.models';

interface SystemCombatActionDraft {
	id: string;
	coreKey: string;
	label: string;
	description: string;
	targetChoiceLabel: string;
	confirmationTitle: string;
}

@Component({
	selector: 'app-admin-system-combat-actions-page',
	standalone: true,
	imports: [
		FormsModule,
		Breadcrumb,
		InputText,
		Tag,
		Textarea,
		EditorActionsBarComponent
	],
	templateUrl: './admin-system-combat-actions-page.component.html',
	styleUrl: './admin-system-combat-actions-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminSystemCombatActionsPageComponent {
	private readonly repository = inject(SYSTEM_COMBAT_ACTIONS_REPOSITORY);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Общие действия' }
	];
	protected readonly actions = signal<SystemCombatAction[]>([]);
	protected readonly selectedActionId = signal<string | null>(null);
	protected readonly draft = signal<SystemCombatActionDraft | null>(null);
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);

	protected readonly hasChanges = computed(
		() => draftSignature(this.draft()) !== this.savedDraftSignature()
	);
	protected readonly selectedAction = computed(() => {
		const id = this.selectedActionId();
		return id ? this.actions().find(action => action.id === id) ?? null : null;
	});
	protected readonly sortedActions = computed(() =>
		[...this.actions()].sort((first, second) => {
			const orderDiff = first.sortOrder - second.sortOrder;
			return orderDiff || first.label.localeCompare(second.label, 'ru');
		})
	);
	protected readonly actionsCount = computed(() =>
		String(this.sortedActions().length)
	);

	constructor() {
		this.loadCatalog();
	}

	protected selectAction(action: SystemCombatAction) {
		this.setDraftFromAction(action);
	}

	protected updateDraftLabel(label: string) {
		this.patchDraft({ label });
	}

	protected updateDraftDescription(description: string) {
		this.patchDraft({ description });
	}

	protected updateDraftTargetChoiceLabel(targetChoiceLabel: string) {
		this.patchDraft({ targetChoiceLabel });
	}

	protected updateDraftConfirmationTitle(confirmationTitle: string) {
		this.patchDraft({ confirmationTitle });
	}

	protected hasTargetChoiceLabel(draft: SystemCombatActionDraft) {
		return draft.coreKey === 'wait_until_after_participant';
	}

	protected hasConfirmationTitle(draft: SystemCombatActionDraft) {
		return (
			draft.coreKey === 'enter_defense_stance' ||
			draft.coreKey === 'end_round_participation'
		);
	}

	protected resetDraft() {
		const action = this.selectedAction();

		if (action) {
			this.setDraftFromAction(action);
		}
	}

	protected saveDraft() {
		const draft = this.draft();

		if (!draft || !this.hasChanges() || this.saving()) {
			return;
		}

		const label = draft.label.trim();

		if (!label) {
			this.errorMessage.set('Название действия обязательно.');
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		this.repository
			.updateAction(draft.id, {
				label,
				description: draft.description.trim(),
				targetChoiceLabel: draft.targetChoiceLabel.trim(),
				confirmationTitle: draft.confirmationTitle.trim()
			})
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: saved => {
					this.upsertAction(saved);
					this.setDraftFromAction(saved);
					this.saving.set(false);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось сохранить общее действие.'
					);
					this.saving.set(false);
				}
			});
	}

	private loadCatalog() {
		this.loading.set(true);
		this.errorMessage.set(null);

		this.repository
			.loadCatalog()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => {
					this.actions.set(catalog.actions);
					this.loading.set(false);
					this.setDraftFromAction(this.sortedActions()[0] ?? null);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить общие действия.'
					);
					this.loading.set(false);
				}
			});
	}

	private setDraftFromAction(action: SystemCombatAction | null) {
		if (!action) {
			this.selectedActionId.set(null);
			this.draft.set(null);
			this.savedDraftSignature.set(draftSignature(null));
			return;
		}

		const draft: SystemCombatActionDraft = {
			id: action.id,
			coreKey: action.coreKey,
			label: action.label,
			description: action.description,
			targetChoiceLabel: action.targetChoiceLabel,
			confirmationTitle: action.confirmationTitle
		};

		this.selectedActionId.set(action.id);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private patchDraft(patch: Partial<SystemCombatActionDraft>) {
		this.draft.update(draft => (draft ? { ...draft, ...patch } : draft));
	}

	private upsertAction(action: SystemCombatAction) {
		this.actions.update(actions => {
			const index = actions.findIndex(item => item.id === action.id);

			if (index === -1) {
				return [...actions, action];
			}

			const next = [...actions];
			next[index] = action;
			return next;
		});
	}
}

function draftSignature(draft: SystemCombatActionDraft | null): string {
	return JSON.stringify(draft ?? null);
}
