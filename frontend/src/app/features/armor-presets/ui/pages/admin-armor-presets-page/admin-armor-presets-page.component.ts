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
import { ARMOR_PRESETS_REPOSITORY } from '../../../data/armor-presets-repository.port';
import { ArmorPreset } from '../../../domain/armor-presets.models';

interface ArmorPresetDraft {
	id: string | null;
	name: string;
	points: number;
	protection: number;
	isActive: boolean;
	sortOrder: number;
}

@Component({
	selector: 'app-admin-armor-presets-page',
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
	templateUrl: './admin-armor-presets-page.component.html',
	styleUrl: './admin-armor-presets-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminArmorPresetsPageComponent {
	private readonly repository = inject(ARMOR_PRESETS_REPOSITORY);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Пресеты брони' }
	];
	protected readonly selectedArmorPresetId = signal<string | null>(null);
	protected readonly searchQuery = signal('');
	protected readonly armorPresets = signal<ArmorPreset[]>([]);
	protected readonly draft = signal<ArmorPresetDraft | null>(null);
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);

	protected readonly hasChanges = computed(
		() => draftSignature(this.draft()) !== this.savedDraftSignature()
	);
	protected readonly selectedArmorPreset = computed(() => {
		const id = this.selectedArmorPresetId();
		return id
			? (this.armorPresets().find(item => item.id === id) ?? null)
			: null;
	});
	protected readonly filteredArmorPresets = computed(() => {
		const query = this.searchQuery().trim().toLowerCase();
		return this.armorPresets()
			.filter(item => {
				const haystack =
					`${item.name} ${item.points} ${item.protection}`.toLowerCase();
				return !query || haystack.includes(query);
			})
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			});
	});
	protected readonly title = computed(() => {
		const draft = this.draft();
		return draft?.id ? draft.name || 'Пресет брони' : 'Новый пресет брони';
	});

	constructor() {
		this.loadCatalog();
	}

	protected setSearchQuery(query: string) {
		this.searchQuery.set(query);
	}

	protected selectArmorPreset(armorPreset: ArmorPreset) {
		if (armorPreset.id === this.selectedArmorPresetId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => this.setDraftFromArmorPreset(armorPreset)
		});
	}

	protected createArmorPreset() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				const draft = createEmptyDraft();
				this.selectedArmorPresetId.set(null);
				this.draft.set(draft);
				this.savedDraftSignature.set(draftSignature(draft));
			}
		});
	}

	protected updateDraftName(name: string) {
		this.patchDraft({ name });
	}

	protected updateDraftPoints(points: number | null) {
		this.patchDraft({ points: points ?? 0 });
	}

	protected updateDraftProtection(protection: number | null) {
		this.patchDraft({ protection: protection ?? 0 });
	}

	protected updateDraftSortOrder(sortOrder: number | null) {
		this.patchDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected updateDraftActive(isActive: boolean) {
		this.patchDraft({ isActive });
	}

	protected resetDraft() {
		const armorPreset = this.selectedArmorPreset();

		if (armorPreset) {
			this.setDraftFromArmorPreset(armorPreset);
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
			this.errorMessage.set('Название пресета брони обязательно.');
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		const command = {
			name,
			points: draft.points,
			protection: draft.protection,
			isActive: draft.isActive,
			sortOrder: draft.sortOrder
		};
		const request = draft.id
			? this.repository.updateArmorPreset(draft.id, command)
			: this.repository.createArmorPreset(command);

		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: saved => {
				this.upsertArmorPreset(saved);
				this.setDraftFromArmorPreset(saved);
				this.saving.set(false);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error
						? error.message
						: 'Не удалось сохранить пресет брони.'
				);
				this.saving.set(false);
			}
		});
	}

	protected deleteSelectedArmorPreset() {
		const draft = this.draft();

		if (!draft?.id || this.saving()) {
			return;
		}

		this.confirmationService.confirm({
			header: 'Удалить пресет брони?',
			message: `«${draft.name}» будет удалён из списка пресетов брони.`,
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.deleteArmorPreset(draft.id as string)
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
					this.armorPresets.set(catalog.armorPresets);
					this.loading.set(false);
					this.selectInitialArmorPreset();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить пресеты брони.'
					);
					this.loading.set(false);
				}
			});
	}

	private selectInitialArmorPreset() {
		const armorPreset = [...this.armorPresets()].sort((first, second) => {
			const orderDiff = first.sortOrder - second.sortOrder;
			return orderDiff || first.name.localeCompare(second.name, 'ru');
		})[0];

		if (armorPreset) {
			this.setDraftFromArmorPreset(armorPreset);
			return;
		}

		const draft = createEmptyDraft();
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private setDraftFromArmorPreset(armorPreset: ArmorPreset) {
		const draft: ArmorPresetDraft = {
			id: armorPreset.id,
			name: armorPreset.name,
			points: armorPreset.points,
			protection: armorPreset.protection,
			isActive: armorPreset.isActive,
			sortOrder: armorPreset.sortOrder
		};

		this.selectedArmorPresetId.set(armorPreset.id);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private patchDraft(patch: Partial<ArmorPresetDraft>) {
		const current = this.draft();

		if (!current) {
			return;
		}

		this.draft.set({ ...current, ...patch });
	}

	private upsertArmorPreset(armorPreset: ArmorPreset) {
		this.armorPresets.update(items => {
			const exists = items.some(item => item.id === armorPreset.id);
			const nextItems = exists
				? items.map(item => (item.id === armorPreset.id ? armorPreset : item))
				: [...items, armorPreset];

			return nextItems.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			});
		});
	}

	private deleteArmorPreset(id: string) {
		this.saving.set(true);
		this.repository
			.deleteArmorPreset(id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.armorPresets.update(items =>
						items.filter(item => item.id !== id)
					);
					this.selectedArmorPresetId.set(null);
					this.draft.set(null);
					this.savedDraftSignature.set('');
					this.saving.set(false);
					this.selectInitialArmorPreset();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось удалить пресет брони.'
					);
					this.saving.set(false);
				}
			});
	}
}

function createEmptyDraft(): ArmorPresetDraft {
	return {
		id: null,
		name: '',
		points: 0,
		protection: 0,
		isActive: true,
		sortOrder: 0
	};
}

function draftSignature(draft: ArmorPresetDraft | null) {
	return draft
		? JSON.stringify({
				id: draft.id,
				name: draft.name.trim(),
				points: draft.points,
				protection: draft.protection,
				isActive: draft.isActive,
				sortOrder: draft.sortOrder
			})
		: '';
}
