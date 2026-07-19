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
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { COMBAT_INTENTS_REPOSITORY } from '../../../data/combat-intents-repository.port';
import {
	CombatIntent,
	CombatIntentTextBlock,
	CombatIntentTextToken
} from '../../../domain/combat-intents.models';

interface CombatIntentDraft {
	id: string | null;
	name: string;
	category: string;
	textBlocks: CombatIntentTextBlock[];
	isActive: boolean;
	sortOrder: number;
}

interface CombatIntentGroup {
	label: string;
	items: CombatIntent[];
}

interface SelectOption<TValue extends string> {
	label: string;
	value: TValue;
}

const TEXT_TOKEN_OPTIONS: SelectOption<CombatIntentTextToken>[] = [
	{ label: 'Название намерения', value: 'intentName' },
	{ label: 'Атакующий', value: 'attackerName' },
	{ label: 'Цель', value: 'targetName' },
	{ label: 'Оружие', value: 'weaponName' },
	{ label: 'Профиль атаки', value: 'attackProfileName' },
	{ label: 'Навык атаки', value: 'attackSkill' },
	{ label: 'Характеристика атаки', value: 'attackCharacteristic' },
	{ label: 'Базовая стоимость', value: 'baseCost' },
	{ label: 'Базовый урон', value: 'baseDamage' },
	{ label: 'Дистанция, м', value: 'rangeMeters' },
	{ label: 'Типы урона оружия', value: 'damageTypes' },
	{ label: 'Выбранный тип урона', value: 'selectedDamageType' },
	{ label: 'Доступные защиты цели', value: 'defenseOptions' },
	{ label: 'Чистые успехи', value: 'cleanSuccesses' },
	{ label: 'Формула урона', value: 'damageFormula' },
	{ label: 'Случайные зоны', value: 'randomHitZones' },
	{ label: 'Основные зоны', value: 'targetedMainZones' },
	{ label: 'Прицельные подзоны', value: 'targetedSubzones' },
	{ label: 'Правило брони зоны', value: 'armorRule' }
];

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
		Select,
		Tag,
		Textarea,
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
	protected readonly textTokenOptions = TEXT_TOKEN_OPTIONS;
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
	protected readonly textPreview = computed(() => {
		const draft = this.draft();
		return draft ? renderCombatIntentText(draft) : '';
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

	protected addTextBlock() {
		this.appendTextBlock({
			kind: 'text',
			text: '',
			isActive: true,
			sortOrder: this.draft()?.textBlocks.length ?? 0
		});
	}

	protected addTextTokenBlock() {
		this.appendTextBlock({
			kind: 'token',
			token: 'weaponName',
			isActive: true,
			sortOrder: this.draft()?.textBlocks.length ?? 0
		});
	}

	protected updateTextBlockText(index: number, text: string) {
		this.patchTextBlock(index, block =>
			block.kind === 'text' ? { ...block, text } : block
		);
	}

	protected updateTextBlockToken(index: number, token: CombatIntentTextToken) {
		this.patchTextBlock(index, block =>
			block.kind === 'token' ? { ...block, token } : block
		);
	}

	protected updateTextBlockActive(index: number, isActive: boolean) {
		this.patchTextBlock(index, block => ({ ...block, isActive }));
	}

	protected removeTextBlock(index: number) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			textBlocks: draft.textBlocks
				.filter((_, currentIndex) => currentIndex !== index)
				.map((block, sortOrder) => ({ ...block, sortOrder }))
		});
	}

	protected moveTextBlock(index: number, direction: -1 | 1) {
		const draft = this.draft();
		const nextIndex = index + direction;

		if (!draft || nextIndex < 0 || nextIndex >= draft.textBlocks.length) {
			return;
		}

		const textBlocks = [...draft.textBlocks];
		const current = textBlocks[index];
		textBlocks[index] = textBlocks[nextIndex];
		textBlocks[nextIndex] = current;

		this.patchDraft({
			textBlocks: textBlocks.map((block, sortOrder) => ({
				...block,
				sortOrder
			}))
		});
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
			textBlocks: draft.textBlocks.map((block, sortOrder) => ({
				...block,
				sortOrder
			})),
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
		const combatIntent = [...this.combatIntents()].sort(
			compareCombatIntents
		)[0];

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
			textBlocks: normalizeCombatIntentTextBlocks(combatIntent.textBlocks),
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

	private appendTextBlock(block: CombatIntentTextBlock) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({ textBlocks: [...draft.textBlocks, block] });
	}

	private patchTextBlock(
		index: number,
		update: (block: CombatIntentTextBlock) => CombatIntentTextBlock
	) {
		this.draft.update(draft => {
			if (!draft) {
				return draft;
			}

			return {
				...draft,
				textBlocks: draft.textBlocks.map((block, currentIndex) =>
					currentIndex === index ? update(block) : block
				)
			};
		});
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
		textBlocks: createDefaultTextBlocks(),
		isActive: true,
		sortOrder: 0
	};
}

function createDefaultTextBlocks(): CombatIntentTextBlock[] {
	return [
		{
			kind: 'text',
			text: 'Вы совершаете ',
			isActive: true,
			sortOrder: 0
		},
		{ kind: 'token', token: 'damageTypes', isActive: true, sortOrder: 1 },
		{
			kind: 'text',
			text: ' атаку выбранным оружием по цели в пределах ',
			isActive: true,
			sortOrder: 2
		},
		{ kind: 'token', token: 'rangeMeters', isActive: true, sortOrder: 3 },
		{
			kind: 'text',
			text: ' м.\n\nЦель может защититься: ',
			isActive: true,
			sortOrder: 4
		},
		{ kind: 'token', token: 'defenseOptions', isActive: true, sortOrder: 5 },
		{
			kind: 'text',
			text: '.\n\nПри попадании цель получает ',
			isActive: true,
			sortOrder: 6
		},
		{
			kind: 'token',
			token: 'selectedDamageType',
			isActive: true,
			sortOrder: 7
		},
		{
			kind: 'text',
			text: ' урон, равный ',
			isActive: true,
			sortOrder: 8
		},
		{ kind: 'token', token: 'damageFormula', isActive: true, sortOrder: 9 },
		{
			kind: 'text',
			text: '. Если после защиты не осталось ни одного чистого успеха, атака не наносит урона, и базовый урон оружия не применяется.\n\nПри попадании зона ранения определяется случайно: ',
			isActive: true,
			sortOrder: 10
		},
		{ kind: 'token', token: 'randomHitZones', isActive: true, sortOrder: 11 },
		{
			kind: 'text',
			text: '. ',
			isActive: true,
			sortOrder: 12
		},
		{ kind: 'token', token: 'armorRule', isActive: true, sortOrder: 13 }
	];
}

function normalizeCombatIntentTextBlocks(
	textBlocks: CombatIntentTextBlock[]
): CombatIntentTextBlock[] {
	return textBlocks
		.filter(block => block.kind === 'text' || block.kind === 'token')
		.map((block, sortOrder) => ({ ...block, sortOrder }));
}

function renderCombatIntentText(draft: CombatIntentDraft): string {
	const text = draft.textBlocks
		.filter(block => block.isActive)
		.sort((first, second) => first.sortOrder - second.sortOrder)
		.map(block =>
			block.kind === 'text'
				? block.text
				: renderCombatIntentTextToken(draft, block.token)
		)
		.join('')
		.replace(/[ \t]+/g, ' ')
		.replace(/ *\n */g, '\n')
		.trim();

	return text || 'Текст для игрока пока не настроен.';
}

function renderCombatIntentTextToken(
	draft: CombatIntentDraft,
	token: CombatIntentTextToken
): string {
	switch (token) {
		case 'intentName':
			return draft.name || 'Намерение';
		case 'attackerName':
			return '{атакующий}';
		case 'targetName':
			return '{цель}';
		case 'weaponName':
			return '{оружие}';
		case 'attackProfileName':
			return '{профиль атаки}';
		case 'attackSkill':
			return '{навык атаки}';
		case 'attackCharacteristic':
			return '{характеристика атаки}';
		case 'baseCost':
			return '{стоимость атаки}';
		case 'baseDamage':
			return '{базовый урон оружия}';
		case 'rangeMeters':
			return '{дистанция атаки}';
		case 'damageTypes':
			return '{доступные типы урона}';
		case 'selectedDamageType':
			return '{выбранный тип урона}';
		case 'defenseOptions':
			return '{доступные защиты цели}';
		case 'cleanSuccesses':
			return '{чистые успехи атаки}';
		case 'damageFormula':
			return '{чистые успехи атаки + базовый урон оружия}';
		case 'randomHitZones':
			return '{случайные зоны цели с весами}';
		case 'targetedMainZones':
			return '{основные зоны цели}';
		case 'targetedSubzones':
			return '{прицельные подзоны цели}';
		case 'armorRule':
			return 'После расчёта итогового урона применяется броня выпавшей зоны. Оставшийся урон снимает здоровье и может вызвать травму.';
	}
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
