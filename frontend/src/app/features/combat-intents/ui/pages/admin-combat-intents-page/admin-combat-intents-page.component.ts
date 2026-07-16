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
import { COMBAT_INTENTS_REPOSITORY } from '../../../data/combat-intents-repository.port';
import { CombatIntent } from '../../../domain/combat-intents.models';

interface CombatIntentDraft {
	id: string | null;
	name: string;
	category: string;
	isActive: boolean;
	sortOrder: number;
}

interface CombatIntentGroup {
	label: string;
	items: CombatIntent[];
}

@Component({
	selector: 'app-admin-combat-intents-page',
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
	templateUrl: './admin-combat-intents-page.component.html',
	styleUrl: './admin-combat-intents-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminCombatIntentsPageComponent {
	private readonly repository = inject(COMBAT_INTENTS_REPOSITORY);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Боевые намерения' }
	];
	protected readonly selectedCombatIntentId = signal<string | null>(null);
	protected readonly searchQuery = signal('');
	protected readonly combatIntents = signal<CombatIntent[]>([]);
	protected readonly draft = signal<CombatIntentDraft | null>(null);
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);

	protected readonly hasChanges = computed(
		() => draftSignature(this.draft()) !== this.savedDraftSignature()
	);
	protected readonly selectedCombatIntent = computed(() => {
		const id = this.selectedCombatIntentId();
		return id
			? (this.combatIntents().find(item => item.id === id) ?? null)
			: null;
	});
	protected readonly filteredCombatIntents = computed(() => {
		const query = this.searchQuery().trim().toLowerCase();
		return this.combatIntents()
			.filter(
				item =>
					!query ||
					item.name.toLowerCase().includes(query) ||
					item.category.toLowerCase().includes(query)
			)
			.sort(compareCombatIntents);
	});
	protected readonly combatIntentGroups = computed<CombatIntentGroup[]>(() =>
		buildCombatIntentGroups(this.filteredCombatIntents())
	);
	protected readonly title = computed(() => {
		const draft = this.draft();
		return draft?.id
			? draft.name || 'Боевое намерение'
			: 'Новое боевое намерение';
	});

	constructor() {
		this.loadCatalog();
	}

	protected setSearchQuery(query: string) {
		this.searchQuery.set(query);
	}

	protected selectCombatIntent(combatIntent: CombatIntent) {
		if (combatIntent.id === this.selectedCombatIntentId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => this.setDraftFromCombatIntent(combatIntent)
		});
	}

	protected createCombatIntent() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				const draft = createEmptyDraft();
				this.selectedCombatIntentId.set(null);
				this.draft.set(draft);
				this.savedDraftSignature.set(draftSignature(draft));
			}
		});
	}

	protected updateDraftName(name: string) {
		this.patchDraft({ name });
	}

	protected updateDraftCategory(category: string) {
		this.patchDraft({ category });
	}

	protected updateDraftSortOrder(sortOrder: number | null) {
		this.patchDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected updateDraftActive(isActive: boolean) {
		this.patchDraft({ isActive });
	}

	protected resetDraft() {
		const combatIntent = this.selectedCombatIntent();

		if (combatIntent) {
			this.setDraftFromCombatIntent(combatIntent);
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
			this.errorMessage.set('Название боевого намерения обязательно.');
			return;
		}

		const category = draft.category.trim();

		if (!category) {
			this.errorMessage.set('Категория боевого намерения обязательна.');
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		const command = {
			name,
			category,
			isActive: draft.isActive,
			sortOrder: draft.sortOrder
		};
		const request = draft.id
			? this.repository.updateCombatIntent(draft.id, command)
			: this.repository.createCombatIntent(command);

		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: saved => {
				this.upsertCombatIntent(saved);
				this.setDraftFromCombatIntent(saved);
				this.saving.set(false);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error
						? error.message
						: 'Не удалось сохранить боевое намерение.'
				);
				this.saving.set(false);
			}
		});
	}

	protected deleteSelectedCombatIntent() {
		const draft = this.draft();

		if (!draft?.id || this.saving()) {
			return;
		}

		this.confirmationService.confirm({
			header: 'Удалить боевое намерение?',
			message: `«${draft.name}» будет удалено из списка боевых намерений.`,
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.deleteCombatIntent(draft.id as string)
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
					this.combatIntents.set(catalog.combatIntents);
					this.loading.set(false);
					this.selectFirstCombatIntent();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить боевые намерения.'
					);
					this.loading.set(false);
				}
			});
	}

	private selectFirstCombatIntent() {
		const combatIntent = [...this.combatIntents()].sort(compareCombatIntents)[0];

		if (combatIntent) {
			this.setDraftFromCombatIntent(combatIntent);
			return;
		}

		const draft = createEmptyDraft();
		this.selectedCombatIntentId.set(null);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private setDraftFromCombatIntent(combatIntent: CombatIntent) {
		const draft: CombatIntentDraft = {
			id: combatIntent.id,
			name: combatIntent.name,
			category: combatIntent.category,
			isActive: combatIntent.isActive,
			sortOrder: combatIntent.sortOrder
		};

		this.selectedCombatIntentId.set(combatIntent.id);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private patchDraft(patch: Partial<CombatIntentDraft>) {
		this.draft.update(draft => (draft ? { ...draft, ...patch } : draft));
	}

	private upsertCombatIntent(combatIntent: CombatIntent) {
		this.combatIntents.update(items => {
			const index = items.findIndex(item => item.id === combatIntent.id);

			if (index === -1) {
				return [...items, combatIntent].sort(compareCombatIntents);
			}

			const next = [...items];
			next[index] = combatIntent;
			return next.sort(compareCombatIntents);
		});
	}

	private deleteCombatIntent(id: string) {
		this.saving.set(true);
		this.errorMessage.set(null);

		this.repository
			.deleteCombatIntent(id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.combatIntents.update(items =>
						items.filter(item => item.id !== id)
					);
					this.saving.set(false);
					this.selectFirstCombatIntent();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось удалить боевое намерение.'
					);
					this.saving.set(false);
				}
			});
	}
}

function createEmptyDraft(): CombatIntentDraft {
	return {
		id: null,
		name: '',
		category: 'Урон и травмы',
		isActive: true,
		sortOrder: 0
	};
}

function draftSignature(draft: CombatIntentDraft | null): string {
	return JSON.stringify(draft ?? null);
}

function compareCombatIntents(first: CombatIntent, second: CombatIntent) {
	const orderDiff = first.sortOrder - second.sortOrder;
	return orderDiff || first.name.localeCompare(second.name, 'ru');
}

function buildCombatIntentGroups(intents: CombatIntent[]): CombatIntentGroup[] {
	const groupMap = new Map<string, CombatIntentGroup>();

	for (const intent of intents) {
		const group = groupMap.get(intent.category);
		if (group) {
			group.items.push(intent);
			continue;
		}

		groupMap.set(intent.category, {
			label: intent.category,
			items: [intent]
		});
	}

	return [...groupMap.values()];
}
