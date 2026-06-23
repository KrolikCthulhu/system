import { CommonModule } from '@angular/common';
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
import { ConfirmationService } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { CONDITIONS_REPOSITORY } from '../../../data/conditions-repository.port';
import { Condition } from '../../../domain/conditions.models';

interface ConditionDraft {
	id: string | null;
	name: string;
	description: string;
	isActive: boolean;
	sortOrder: number;
}

@Component({
	selector: 'app-admin-conditions-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Breadcrumb,
		Button,
		ConfirmDialog,
		IconField,
		InputIcon,
		InputNumber,
		InputText,
		Tag,
		Textarea,
		ToggleSwitch,
		EditorActionsBarComponent
	],
	templateUrl: './admin-conditions-page.component.html',
	styleUrl: './admin-conditions-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminConditionsPageComponent {
	private readonly repository = inject(CONDITIONS_REPOSITORY);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Состояния' }
	];
	protected readonly selectedConditionId = signal<string | null>(null);
	protected readonly searchQuery = signal('');
	protected readonly conditions = signal<Condition[]>([]);
	protected readonly draft = signal<ConditionDraft | null>(null);
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);

	protected readonly hasChanges = computed(
		() => draftSignature(this.draft()) !== this.savedDraftSignature()
	);
	protected readonly selectedCondition = computed(() => {
		const id = this.selectedConditionId();
		return id ? this.conditions().find(item => item.id === id) ?? null : null;
	});
	protected readonly filteredConditions = computed(() => {
		const query = this.searchQuery().trim().toLowerCase();
		return this.conditions()
			.filter(item => {
				const haystack = `${item.name} ${item.description}`.toLowerCase();
				return !query || haystack.includes(query);
			})
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			});
	});
	protected readonly title = computed(() => {
		const draft = this.draft();
		return draft?.id ? draft.name || 'Состояние' : 'Новое состояние';
	});

	constructor() {
		this.loadCatalog();
	}

	protected setSearchQuery(query: string) {
		this.searchQuery.set(query);
	}

	protected selectCondition(condition: Condition) {
		if (condition.id === this.selectedConditionId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => this.setDraftFromCondition(condition)
		});
	}

	protected createCondition() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				const draft = createEmptyDraft();
				this.selectedConditionId.set(null);
				this.draft.set(draft);
				this.savedDraftSignature.set(draftSignature(draft));
			}
		});
	}

	protected updateDraftName(name: string) {
		this.patchDraft({ name });
	}

	protected updateDraftDescription(description: string) {
		this.patchDraft({ description });
	}

	protected updateDraftSortOrder(sortOrder: number | null) {
		this.patchDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected updateDraftActive(isActive: boolean) {
		this.patchDraft({ isActive });
	}

	protected resetDraft() {
		const condition = this.selectedCondition();

		if (condition) {
			this.setDraftFromCondition(condition);
			return;
		}

		const draft = createEmptyDraft();
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	protected saveDraft() {
		const draft = this.draft();

		if (!draft || !this.hasChanges() || this.saving()) {
			return;
		}

		const name = draft.name.trim();

		if (!name) {
			this.errorMessage.set('Название состояния обязательно.');
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		const command = {
			name,
			description: draft.description.trim(),
			isActive: draft.isActive,
			sortOrder: draft.sortOrder
		};
		const request = draft.id
			? this.repository.updateCondition(draft.id, command)
			: this.repository.createCondition(command);

		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: saved => {
				this.upsertCondition(saved);
				this.setDraftFromCondition(saved);
				this.saving.set(false);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error ? error.message : 'Не удалось сохранить состояние.'
				);
				this.saving.set(false);
			}
		});
	}

	protected deleteSelectedCondition() {
		const draft = this.draft();

		if (!draft?.id || this.saving()) {
			return;
		}

		this.confirmationService.confirm({
			header: 'Удалить состояние?',
			message: `«${draft.name}» будет удалено из списка состояний.`,
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.deleteCondition(draft.id as string)
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
					this.conditions.set(catalog.conditions);
					this.loading.set(false);
					this.selectFirstCondition();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить состояния.'
					);
					this.loading.set(false);
				}
			});
	}

	private selectFirstCondition() {
		const condition = [...this.conditions()].sort((first, second) => {
			const orderDiff = first.sortOrder - second.sortOrder;
			return orderDiff || first.name.localeCompare(second.name, 'ru');
		})[0];

		if (condition) {
			this.setDraftFromCondition(condition);
			return;
		}

		const draft = createEmptyDraft();
		this.selectedConditionId.set(null);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private setDraftFromCondition(condition: Condition) {
		const draft: ConditionDraft = {
			id: condition.id,
			name: condition.name,
			description: condition.description,
			isActive: condition.isActive,
			sortOrder: condition.sortOrder
		};

		this.selectedConditionId.set(condition.id);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private patchDraft(patch: Partial<ConditionDraft>) {
		this.draft.update(draft => (draft ? { ...draft, ...patch } : draft));
	}

	private upsertCondition(condition: Condition) {
		this.conditions.update(items => {
			const index = items.findIndex(item => item.id === condition.id);

			if (index === -1) {
				return [...items, condition];
			}

			const next = [...items];
			next[index] = condition;
			return next;
		});
	}

	private deleteCondition(id: string) {
		this.saving.set(true);
		this.errorMessage.set(null);

		this.repository
			.deleteCondition(id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.conditions.update(items => items.filter(item => item.id !== id));
					this.saving.set(false);
					this.selectFirstCondition();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error ? error.message : 'Не удалось удалить состояние.'
					);
					this.saving.set(false);
				}
			});
	}
}

function createEmptyDraft(): ConditionDraft {
	return {
		id: null,
		name: '',
		description: '',
		isActive: true,
		sortOrder: 0
	};
}

function draftSignature(draft: ConditionDraft | null): string {
	return JSON.stringify(draft ?? null);
}
