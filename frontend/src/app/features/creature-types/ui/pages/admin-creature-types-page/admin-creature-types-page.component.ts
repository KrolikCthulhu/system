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
import { ToggleSwitch } from 'primeng/toggleswitch';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { CREATURE_TYPES_REPOSITORY } from '../../../data/creature-types-repository.port';
import { CreatureType } from '../../../domain/creature-types.models';

interface CreatureTypeDraft {
	id: string | null;
	name: string;
	isActive: boolean;
	sortOrder: number;
}

@Component({
	selector: 'app-admin-creature-types-page',
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
		ToggleSwitch,
		EditorActionsBarComponent
	],
	templateUrl: './admin-creature-types-page.component.html',
	styleUrl: './admin-creature-types-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminCreatureTypesPageComponent {
	private readonly repository = inject(CREATURE_TYPES_REPOSITORY);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Типы существ' }
	];
	protected readonly selectedCreatureTypeId = signal<string | null>(null);
	protected readonly searchQuery = signal('');
	protected readonly creatureTypes = signal<CreatureType[]>([]);
	protected readonly draft = signal<CreatureTypeDraft | null>(null);
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);

	protected readonly hasChanges = computed(
		() => draftSignature(this.draft()) !== this.savedDraftSignature()
	);
	protected readonly selectedCreatureType = computed(() => {
		const id = this.selectedCreatureTypeId();
		return id
			? (this.creatureTypes().find(item => item.id === id) ?? null)
			: null;
	});
	protected readonly filteredCreatureTypes = computed(() => {
		const query = this.searchQuery().trim().toLowerCase();
		return this.creatureTypes()
			.filter(item => !query || item.name.toLowerCase().includes(query))
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			});
	});
	protected readonly title = computed(() => {
		const draft = this.draft();
		return draft?.id ? draft.name || 'Тип существа' : 'Новый тип существа';
	});

	constructor() {
		this.loadCatalog();
	}

	protected setSearchQuery(query: string) {
		this.searchQuery.set(query);
	}

	protected selectCreatureType(creatureType: CreatureType) {
		if (creatureType.id === this.selectedCreatureTypeId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => this.setDraftFromCreatureType(creatureType)
		});
	}

	protected createCreatureType() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				const draft = createEmptyDraft();
				this.selectedCreatureTypeId.set(null);
				this.draft.set(draft);
				this.savedDraftSignature.set(draftSignature(draft));
			}
		});
	}

	protected updateDraftName(name: string) {
		this.patchDraft({ name });
	}

	protected updateDraftSortOrder(sortOrder: number | null) {
		this.patchDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected updateDraftActive(isActive: boolean) {
		this.patchDraft({ isActive });
	}

	protected resetDraft() {
		const creatureType = this.selectedCreatureType();

		if (creatureType) {
			this.setDraftFromCreatureType(creatureType);
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
			this.errorMessage.set('Название типа существа обязательно.');
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		const command = {
			name,
			isActive: draft.isActive,
			sortOrder: draft.sortOrder
		};
		const request = draft.id
			? this.repository.updateCreatureType(draft.id, command)
			: this.repository.createCreatureType(command);

		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: saved => {
				this.upsertCreatureType(saved);
				this.setDraftFromCreatureType(saved);
				this.saving.set(false);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error
						? error.message
						: 'Не удалось сохранить тип существа.'
				);
				this.saving.set(false);
			}
		});
	}

	protected deleteSelectedCreatureType() {
		const draft = this.draft();

		if (!draft?.id || this.saving()) {
			return;
		}

		this.confirmationService.confirm({
			header: 'Удалить тип существа?',
			message: `«${draft.name}» будет удалён из списка типов существ.`,
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.deleteCreatureType(draft.id as string)
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
					this.creatureTypes.set(catalog.creatureTypes);
					this.loading.set(false);
					this.selectFirstCreatureType();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить типы существ.'
					);
					this.loading.set(false);
				}
			});
	}

	private selectFirstCreatureType() {
		const creatureType = [...this.creatureTypes()].sort((first, second) => {
			const orderDiff = first.sortOrder - second.sortOrder;
			return orderDiff || first.name.localeCompare(second.name, 'ru');
		})[0];

		if (creatureType) {
			this.setDraftFromCreatureType(creatureType);
			return;
		}

		const draft = createEmptyDraft();
		this.selectedCreatureTypeId.set(null);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private setDraftFromCreatureType(creatureType: CreatureType) {
		const draft: CreatureTypeDraft = {
			id: creatureType.id,
			name: creatureType.name,
			isActive: creatureType.isActive,
			sortOrder: creatureType.sortOrder
		};

		this.selectedCreatureTypeId.set(creatureType.id);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private patchDraft(patch: Partial<CreatureTypeDraft>) {
		this.draft.update(draft => (draft ? { ...draft, ...patch } : draft));
	}

	private upsertCreatureType(creatureType: CreatureType) {
		this.creatureTypes.update(items => {
			const index = items.findIndex(item => item.id === creatureType.id);

			if (index === -1) {
				return [...items, creatureType];
			}

			const next = [...items];
			next[index] = creatureType;
			return next;
		});
	}

	private deleteCreatureType(id: string) {
		this.saving.set(true);
		this.errorMessage.set(null);

		this.repository
			.deleteCreatureType(id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.creatureTypes.update(items =>
						items.filter(item => item.id !== id)
					);
					this.saving.set(false);
					this.selectFirstCreatureType();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось удалить тип существа.'
					);
					this.saving.set(false);
				}
			});
	}
}

function createEmptyDraft(): CreatureTypeDraft {
	return {
		id: null,
		name: '',
		isActive: true,
		sortOrder: 0
	};
}

function draftSignature(draft: CreatureTypeDraft | null): string {
	return JSON.stringify(draft ?? null);
}
