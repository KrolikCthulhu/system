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
import { DAMAGE_TYPES_REPOSITORY } from '../../../data/damage-types-repository.port';
import { DamageType } from '../../../domain/damage-types.models';

interface DamageTypeDraft {
	id: string | null;
	name: string;
	description: string;
	isActive: boolean;
	sortOrder: number;
}

@Component({
	selector: 'app-admin-damage-types-page',
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
	templateUrl: './admin-damage-types-page.component.html',
	styleUrl: './admin-damage-types-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminDamageTypesPageComponent {
	private readonly repository = inject(DAMAGE_TYPES_REPOSITORY);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Типы урона' }
	];
	protected readonly selectedDamageTypeId = signal<string | null>(null);
	protected readonly searchQuery = signal('');
	protected readonly damageTypes = signal<DamageType[]>([]);
	protected readonly draft = signal<DamageTypeDraft | null>(null);
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);

	protected readonly hasChanges = computed(
		() => draftSignature(this.draft()) !== this.savedDraftSignature()
	);
	protected readonly selectedDamageType = computed(() => {
		const id = this.selectedDamageTypeId();
		return id ? this.damageTypes().find(item => item.id === id) ?? null : null;
	});
	protected readonly filteredDamageTypes = computed(() => {
		const query = this.searchQuery().trim().toLowerCase();
		return this.damageTypes()
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
		return draft?.id ? draft.name || 'Тип урона' : 'Новый тип урона';
	});

	constructor() {
		this.loadCatalog();
	}

	protected setSearchQuery(query: string) {
		this.searchQuery.set(query);
	}

	protected selectDamageType(damageType: DamageType) {
		if (damageType.id === this.selectedDamageTypeId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => this.setDraftFromDamageType(damageType)
		});
	}

	protected createDamageType() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				const draft = createEmptyDraft();
				this.selectedDamageTypeId.set(null);
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
		const damageType = this.selectedDamageType();

		if (damageType) {
			this.setDraftFromDamageType(damageType);
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
			this.errorMessage.set('Название типа урона обязательно.');
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
			? this.repository.updateDamageType(draft.id, command)
			: this.repository.createDamageType(command);

		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: saved => {
				this.upsertDamageType(saved);
				this.setDraftFromDamageType(saved);
				this.saving.set(false);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error ? error.message : 'Не удалось сохранить тип урона.'
				);
				this.saving.set(false);
			}
		});
	}

	protected deleteSelectedDamageType() {
		const draft = this.draft();

		if (!draft?.id || this.saving()) {
			return;
		}

		this.confirmationService.confirm({
			header: 'Удалить тип урона?',
			message: `«${draft.name}» будет удалён из списка типов урона.`,
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.deleteDamageType(draft.id as string)
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
					this.damageTypes.set(catalog.damageTypes);
					this.loading.set(false);
					this.selectFirstDamageType();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить типы урона.'
					);
					this.loading.set(false);
				}
			});
	}

	private selectFirstDamageType() {
		const damageType = [...this.damageTypes()].sort((first, second) => {
			const orderDiff = first.sortOrder - second.sortOrder;
			return orderDiff || first.name.localeCompare(second.name, 'ru');
		})[0];

		if (damageType) {
			this.setDraftFromDamageType(damageType);
			return;
		}

		const draft = createEmptyDraft();
		this.selectedDamageTypeId.set(null);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private setDraftFromDamageType(damageType: DamageType) {
		const draft: DamageTypeDraft = {
			id: damageType.id,
			name: damageType.name,
			description: damageType.description,
			isActive: damageType.isActive,
			sortOrder: damageType.sortOrder
		};

		this.selectedDamageTypeId.set(damageType.id);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private patchDraft(patch: Partial<DamageTypeDraft>) {
		this.draft.update(draft => (draft ? { ...draft, ...patch } : draft));
	}

	private upsertDamageType(damageType: DamageType) {
		this.damageTypes.update(items => {
			const index = items.findIndex(item => item.id === damageType.id);

			if (index === -1) {
				return [...items, damageType];
			}

			const next = [...items];
			next[index] = damageType;
			return next;
		});
	}

	private deleteDamageType(id: string) {
		this.saving.set(true);
		this.errorMessage.set(null);

		this.repository
			.deleteDamageType(id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.damageTypes.update(items => items.filter(item => item.id !== id));
					this.saving.set(false);
					this.selectFirstDamageType();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error ? error.message : 'Не удалось удалить тип урона.'
					);
					this.saving.set(false);
				}
			});
	}
}

function createEmptyDraft(): DamageTypeDraft {
	return {
		id: null,
		name: '',
		description: '',
		isActive: true,
		sortOrder: 0
	};
}

function draftSignature(draft: DamageTypeDraft | null): string {
	return JSON.stringify(draft ?? null);
}
