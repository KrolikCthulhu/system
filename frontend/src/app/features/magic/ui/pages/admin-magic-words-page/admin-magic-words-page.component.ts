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
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import {
	MAGIC_WORD_TYPE_OPTIONS,
	MagicWord,
	MagicWordType,
	magicWordTypeLabel,
	magicWordTypePluralLabel
} from '../../../domain/magic-word.models';
import { MAGIC_WORDS_REPOSITORY } from '../../../data/magic-words-repository.port';

interface MagicWordDraft {
	id: string | null;
	type: MagicWordType;
	name: string;
	description: string;
	isActive: boolean;
	sortOrder: number;
	allowedGestureIds: string[];
}

@Component({
	selector: 'app-admin-magic-words-page',
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
		MultiSelect,
		Select,
		Tag,
		Textarea,
		ToggleSwitch,
		EditorActionsBarComponent
	],
	templateUrl: './admin-magic-words-page.component.html',
	styleUrl: './admin-magic-words-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminMagicWordsPageComponent {
	private readonly repository = inject(MAGIC_WORDS_REPOSITORY);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Слова магии' }
	];
	protected readonly typeOptions = MAGIC_WORD_TYPE_OPTIONS;
	protected readonly selectedType = signal<MagicWordType>('ACTION');
	protected readonly selectedWordId = signal<string | null>(null);
	protected readonly searchQuery = signal('');
	protected readonly words = signal<MagicWord[]>([]);
	protected readonly draft = signal<MagicWordDraft | null>(null);
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);

	protected readonly hasChanges = computed(
		() => draftSignature(this.draft()) !== this.savedDraftSignature()
	);
	protected readonly selectedWord = computed(() => {
		const id = this.selectedWordId();
		return id ? this.words().find(word => word.id === id) ?? null : null;
	});
	protected readonly filteredWords = computed(() => {
		const query = this.searchQuery().trim().toLowerCase();
		return this.words()
			.filter(word => word.type === this.selectedType())
			.filter(word => {
				const haystack = `${word.name} ${word.description}`.toLowerCase();
				return !query || haystack.includes(query);
			})
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			});
	});
	protected readonly gestureOptions = computed(() =>
		this.words()
			.filter(word => word.type === 'GESTURE')
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			})
			.map(word => ({ id: word.id, name: word.name }))
	);
	protected readonly typeCounts = computed(() => {
		const counts = new Map<MagicWordType, number>();

		for (const option of this.typeOptions) {
			counts.set(option.value, 0);
		}

		for (const word of this.words()) {
			counts.set(word.type, (counts.get(word.type) ?? 0) + 1);
		}

		return counts;
	});
	protected readonly title = computed(() => {
		const draft = this.draft();
		return draft?.id
			? draft.name || 'Слово магии'
			: `Новое слово: ${magicWordTypeLabel(this.selectedType()).toLowerCase()}`;
	});
	protected readonly typeLabel = computed(() =>
		magicWordTypeLabel(this.draft()?.type ?? this.selectedType())
	);

	constructor() {
		this.loadWords();
	}

	protected setSearchQuery(query: string) {
		this.searchQuery.set(query);
	}

	protected selectType(type: MagicWordType) {
		if (type === this.selectedType()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				this.selectedType.set(type);
				this.selectFirstWord(type);
			}
		});
	}

	protected selectWord(word: MagicWord) {
		if (word.id === this.selectedWordId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => this.setDraftFromWord(word)
		});
	}

	protected createWord() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				const draft = createEmptyDraft(this.selectedType());
				this.selectedWordId.set(null);
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

	protected updateDraftType(type: MagicWordType) {
		const allowedGestureIds =
			type === 'MODIFIER' ? this.draft()?.allowedGestureIds ?? [] : [];
		this.patchDraft({ type, allowedGestureIds });
	}

	protected updateDraftSortOrder(sortOrder: number | null) {
		this.patchDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected updateDraftActive(isActive: boolean) {
		this.patchDraft({ isActive });
	}

	protected updateDraftAllowedGestures(allowedGestureIds: string[]) {
		this.patchDraft({ allowedGestureIds });
	}

	protected resetDraft() {
		const word = this.selectedWord();

		if (word) {
			this.setDraftFromWord(word);
			return;
		}

		const draft = createEmptyDraft(this.selectedType());
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
			this.errorMessage.set('Название слова магии обязательно.');
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		const command = {
			type: draft.type,
			name,
			description: draft.description.trim(),
			isActive: draft.isActive,
			sortOrder: draft.sortOrder,
			allowedGestureIds:
				draft.type === 'MODIFIER' ? draft.allowedGestureIds : []
		};
		const request = draft.id
			? this.repository.updateWord(draft.id, command)
			: this.repository.createWord(command);

		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: saved => {
				this.upsertWord(saved);
				this.selectedType.set(saved.type);
				this.setDraftFromWord(saved);
				this.saving.set(false);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error ? error.message : 'Не удалось сохранить слово магии.'
				);
				this.saving.set(false);
			}
		});
	}

	protected deleteSelectedWord() {
		const word = this.selectedWord();

		if (!word || this.saving()) {
			return;
		}

		this.confirmationService.confirm({
			header: 'Удалить слово магии?',
			message: `«${word.name}» будет удалено из списка слов магии.`,
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.deleteWord(word)
		});
	}

	protected typePluralLabel(type: MagicWordType) {
		return magicWordTypePluralLabel(type);
	}

	protected getTypeCount(type: MagicWordType) {
		return this.typeCounts().get(type) ?? 0;
	}

	private loadWords() {
		this.loading.set(true);
		this.errorMessage.set(null);

		this.repository
			.loadCatalog()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => {
					this.words.set(catalog.words);
					this.loading.set(false);
					this.selectFirstWord(this.selectedType());
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить слова магии.'
					);
					this.loading.set(false);
				}
			});
	}

	private selectFirstWord(type: MagicWordType) {
		const word = this.words()
			.filter(item => item.type === type)
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			})[0];

		if (word) {
			this.setDraftFromWord(word);
			return;
		}

		const draft = createEmptyDraft(type);
		this.selectedWordId.set(null);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private setDraftFromWord(word: MagicWord) {
		const draft: MagicWordDraft = {
			id: word.id,
			type: word.type,
			name: word.name,
			description: word.description,
			isActive: word.isActive,
			sortOrder: word.sortOrder,
			allowedGestureIds: [...word.allowedGestureIds]
		};

		this.selectedWordId.set(word.id);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private patchDraft(patch: Partial<MagicWordDraft>) {
		this.draft.update(draft => (draft ? { ...draft, ...patch } : draft));
	}

	private upsertWord(word: MagicWord) {
		this.words.update(words => {
			const index = words.findIndex(item => item.id === word.id);

			if (index === -1) {
				return [...words, word];
			}

			const next = [...words];
			next[index] = word;
			return next;
		});
	}

	private deleteWord(word: MagicWord) {
		this.saving.set(true);
		this.errorMessage.set(null);

		this.repository
			.deleteWord(word.id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.words.update(words => words.filter(item => item.id !== word.id));
					this.saving.set(false);
					this.selectFirstWord(word.type);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error ? error.message : 'Не удалось удалить слово магии.'
					);
					this.saving.set(false);
				}
			});
	}
}

function createEmptyDraft(type: MagicWordType): MagicWordDraft {
	return {
		id: null,
		type,
		name: '',
		description: '',
		isActive: true,
		sortOrder: 0,
		allowedGestureIds: []
	};
}

function draftSignature(draft: MagicWordDraft | null): string {
	return JSON.stringify(draft ?? null);
}
