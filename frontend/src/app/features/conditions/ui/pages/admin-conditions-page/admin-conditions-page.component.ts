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
import { forkJoin } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Dialog } from 'primeng/dialog';
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
import {
	ATTRIBUTES_REPOSITORY,
	AttributesRepository
} from '../../../../attributes/data/attributes-repository.port';
import { Characteristic } from '../../../../attributes/domain/attributes.models';
import {
	SKILLS_REPOSITORY,
	SkillsRepository
} from '../../../../skills/data/skills-repository.port';
import { Skill } from '../../../../skills/domain/skills.models';
import { CONDITIONS_REPOSITORY } from '../../../data/conditions-repository.port';
import {
	ConditionDurationType,
	ConditionEffectScope,
	ConditionEffectType,
	ConditionRepeatDurationMode,
	ConditionRepeatLevelMode,
	ConditionRemovalMethod,
	ConditionTextBlock,
	ConditionTextToken
} from '../../../domain/condition-rules.models';
import { Condition } from '../../../domain/conditions.models';

interface SelectOption<TValue extends string> {
	label: string;
	value: TValue;
}

interface TargetOption {
	label: string;
	value: string;
}

interface ConditionEffectDraft {
	type: ConditionEffectType;
	scope: ConditionEffectScope;
	value: number | null;
	targetId: string | null;
	timing: EffectTiming;
	ruleText: string;
	sortOrder: number;
}

interface ConditionDraft {
	id: string | null;
	name: string;
	description: string;
	durationType: ConditionDurationType;
	repeatLevelMode: ConditionRepeatLevelMode;
	repeatDurationMode: ConditionRepeatDurationMode;
	maxLevel: number;
	removalMethods: ConditionRemovalMethod[];
	effects: ConditionEffectDraft[];
	textBlocks: ConditionTextBlock[];
	isActive: boolean;
	sortOrder: number;
}

type EffectTiming =
	| 'owner_activation_start'
	| 'owner_activation_end'
	| 'round_start'
	| 'round_end';

const DURATION_OPTIONS: SelectOption<ConditionDurationType>[] = [
	{
		label: 'До следующей активации владельца',
		value: 'until_owner_next_activation'
	},
	{ label: 'До начала следующего раунда', value: 'until_next_round_start' },
	{ label: 'Количество раундов', value: 'round_count' },
	{ label: 'Игровое время', value: 'game_time' },
	{ label: 'До короткого отдыха', value: 'until_short_rest' },
	{ label: 'До полноценного отдыха', value: 'until_full_rest' },
	{ label: 'До лечения', value: 'until_healed' },
	{ label: 'Пока не снято', value: 'until_removed' },
	{ label: 'Постоянно', value: 'permanent' }
];

const REPEAT_LEVEL_OPTIONS: SelectOption<ConditionRepeatLevelMode>[] = [
	{ label: 'Сохранить текущий', value: 'keep_current' },
	{ label: 'Заменить новым', value: 'replace_new' },
	{ label: 'Сложить', value: 'add' },
	{ label: 'Оставить наибольший', value: 'keep_highest' }
];

const REPEAT_DURATION_OPTIONS: SelectOption<ConditionRepeatDurationMode>[] = [
	{ label: 'Сохранить текущую', value: 'keep_current' },
	{ label: 'Заменить новой', value: 'replace_new' },
	{ label: 'Сложить', value: 'add' },
	{ label: 'Оставить наибольшую', value: 'keep_highest' }
];

const REMOVAL_OPTIONS: SelectOption<ConditionRemovalMethod>[] = [
	{ label: 'Проходит автоматически', value: 'automatic' },
	{ label: 'Потратить Потенциал', value: 'spend_potential' },
	{ label: 'Успешная проверка', value: 'successful_check' },
	{ label: 'Получить лечение', value: 'healing' },
	{ label: 'Отдых', value: 'rest' },
	{ label: 'Устранить источник', value: 'remove_source' }
];

const EFFECT_TYPE_OPTIONS: SelectOption<ConditionEffectType>[] = [
	{ label: 'Изменение пула кубиков', value: 'dice_pool_modifier' },
	{ label: 'Изменение стоимости Потенциала', value: 'potential_cost_modifier' },
	{ label: 'Периодический урон', value: 'periodic_damage' },
	{ label: 'Запрет действия', value: 'action_forbidden' },
	{ label: 'Запрет реакции', value: 'reaction_forbidden' },
	{ label: 'Изменение скорости', value: 'speed_modifier' },
	{ label: 'Изменение защиты', value: 'defense_modifier' },
	{ label: 'Изменение получаемого урона', value: 'incoming_damage_modifier' },
	{ label: 'Текстовое особое правило', value: 'special_rule' }
];

const EFFECT_SCOPE_OPTIONS: SelectOption<ConditionEffectScope>[] = [
	{ label: 'Все проверки', value: 'all_checks' },
	{ label: 'Проверки Разума', value: 'mind_checks' },
	{ label: 'Проверки Тела', value: 'body_checks' },
	{ label: 'Конкретная характеристика', value: 'characteristic' },
	{ label: 'Конкретный навык', value: 'skill' },
	{ label: 'Атаки', value: 'attacks' },
	{ label: 'Уклонение', value: 'dodge' },
	{ label: 'Парирование', value: 'parry' },
	{ label: 'Перемещение', value: 'movement' }
];

const EFFECT_TIMING_OPTIONS: SelectOption<EffectTiming>[] = [
	{ label: 'В начале активации владельца', value: 'owner_activation_start' },
	{ label: 'В конце активации владельца', value: 'owner_activation_end' },
	{ label: 'В начале раунда', value: 'round_start' },
	{ label: 'В конце раунда', value: 'round_end' }
];

const TEXT_TOKEN_OPTIONS: SelectOption<ConditionTextToken>[] = [
	{ label: 'Название состояния', value: 'conditionName' },
	{ label: 'Описание', value: 'description' },
	{ label: 'Длительность', value: 'duration' },
	{ label: 'Текущий уровень', value: 'currentLevel' },
	{ label: 'Максимальный уровень', value: 'maxLevel' },
	{ label: 'Оставшаяся длительность', value: 'remainingDuration' },
	{ label: 'Способы снятия', value: 'removalMethods' },
	{ label: 'Эффекты', value: 'effects' },
	{ label: 'Источник состояния', value: 'source' },
	{ label: 'Часть тела', value: 'bodyPart' }
];

@Component({
	selector: 'app-admin-conditions-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Breadcrumb,
		Button,
		Checkbox,
		ConfirmDialog,
		Dialog,
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
	templateUrl: './admin-conditions-page.component.html',
	styleUrl: './admin-conditions-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminConditionsPageComponent {
	private readonly repository = inject(CONDITIONS_REPOSITORY);
	private readonly attributesRepository = inject<AttributesRepository>(
		ATTRIBUTES_REPOSITORY
	);
	private readonly skillsRepository =
		inject<SkillsRepository>(SKILLS_REPOSITORY);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly durationOptions = DURATION_OPTIONS;
	protected readonly repeatLevelOptions = REPEAT_LEVEL_OPTIONS;
	protected readonly repeatDurationOptions = REPEAT_DURATION_OPTIONS;
	protected readonly removalOptions = REMOVAL_OPTIONS;
	protected readonly effectTypeOptions = EFFECT_TYPE_OPTIONS;
	protected readonly effectScopeOptions = EFFECT_SCOPE_OPTIONS;
	protected readonly effectTimingOptions = EFFECT_TIMING_OPTIONS;
	protected readonly textTokenOptions = TEXT_TOKEN_OPTIONS;
	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Состояния' }
	];
	protected readonly selectedConditionId = signal<string | null>(null);
	protected readonly searchQuery = signal('');
	protected readonly conditions = signal<Condition[]>([]);
	protected readonly characteristics = signal<Characteristic[]>([]);
	protected readonly skills = signal<Skill[]>([]);
	protected readonly draft = signal<ConditionDraft | null>(null);
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly importDialogVisible = signal(false);
	protected readonly importText = signal('');
	protected readonly importErrorMessage = signal<string | null>(null);

	protected readonly hasChanges = computed(
		() => draftSignature(this.draft()) !== this.savedDraftSignature()
	);
	protected readonly selectedCondition = computed(() => {
		const id = this.selectedConditionId();
		return id ? (this.conditions().find(item => item.id === id) ?? null) : null;
	});
	protected readonly filteredConditions = computed(() => {
		const query = this.searchQuery().trim().toLowerCase();
		return this.conditions()
			.filter(item => {
				const haystack =
					`${item.name} ${item.description} ${item.durationType}`.toLowerCase();
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
	protected readonly characteristicOptions = computed<TargetOption[]>(() =>
		this.characteristics()
			.filter(item => item.isActive)
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			})
			.map(item => ({
				label: item.name,
				value: item.id
			}))
	);
	protected readonly skillOptions = computed<TargetOption[]>(() =>
		this.skills()
			.filter(item => item.isActive)
			.sort((first, second) => first.name.localeCompare(second.name, 'ru'))
			.map(item => ({
				label: item.name,
				value: item.id
			}))
	);

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

	protected updateDraftDurationType(durationType: ConditionDurationType) {
		this.patchDraft({ durationType });
	}

	protected updateDraftRepeatLevelMode(
		repeatLevelMode: ConditionRepeatLevelMode
	) {
		this.patchDraft({ repeatLevelMode });
	}

	protected updateDraftRepeatDurationMode(
		repeatDurationMode: ConditionRepeatDurationMode
	) {
		this.patchDraft({ repeatDurationMode });
	}

	protected updateDraftMaxLevel(maxLevel: number | null) {
		this.patchDraft({ maxLevel: Math.max(1, maxLevel ?? 1) });
	}

	protected updateDraftSortOrder(sortOrder: number | null) {
		this.patchDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected updateDraftActive(isActive: boolean) {
		this.patchDraft({ isActive });
	}

	protected showImportDialog() {
		this.importText.set(JSON.stringify(buildImportExample(), null, 2));
		this.importErrorMessage.set(null);
		this.importDialogVisible.set(true);
	}

	protected hideImportDialog() {
		this.importDialogVisible.set(false);
	}

	protected updateImportText(value: string) {
		this.importText.set(value);
		this.importErrorMessage.set(null);
	}

	protected applyImportJson() {
		const imported = parseConditionImport(this.importText());

		if (!imported.ok) {
			this.importErrorMessage.set(imported.message);
			return;
		}

		const current = this.draft() ?? createEmptyDraft();
		const draft: ConditionDraft = {
			...current,
			...imported.value,
			id: current.id
		};

		this.draft.set(draft);
		this.importDialogVisible.set(false);
	}

	protected hasRemovalMethod(method: ConditionRemovalMethod) {
		return this.draft()?.removalMethods.includes(method) ?? false;
	}

	protected toggleRemovalMethod(
		method: ConditionRemovalMethod,
		checked: boolean
	) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		const removalMethods = checked
			? [...new Set([...draft.removalMethods, method])]
			: draft.removalMethods.filter(item => item !== method);

		this.patchDraft({ removalMethods });
	}

	protected addEffect() {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			effects: [
				...draft.effects,
				{
					type: 'dice_pool_modifier',
					scope: 'all_checks',
					value: 0,
					targetId: null,
					timing: 'owner_activation_start',
					ruleText: '',
					sortOrder: draft.effects.length
				}
			]
		});
	}

	protected removeEffect(index: number) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			effects: draft.effects
				.filter((_, currentIndex) => currentIndex !== index)
				.map((effect, sortOrder) => ({ ...effect, sortOrder }))
		});
	}

	protected updateEffectType(index: number, type: ConditionEffectType) {
		this.patchEffect(index, { type });
	}

	protected updateEffectScope(index: number, scope: ConditionEffectScope) {
		this.patchEffect(index, { scope });
	}

	protected updateEffectValue(index: number, value: number | null) {
		this.patchEffect(index, { value });
	}

	protected updateEffectTargetId(index: number, targetId: string | null) {
		this.patchEffect(index, { targetId });
	}

	protected updateEffectTiming(index: number, timing: EffectTiming) {
		this.patchEffect(index, { timing });
	}

	protected updateEffectRuleText(index: number, ruleText: string) {
		this.patchEffect(index, { ruleText });
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
			token: 'effects',
			isActive: true,
			sortOrder: this.draft()?.textBlocks.length ?? 0
		});
	}

	protected updateTextBlockText(index: number, text: string) {
		this.patchTextBlock(index, block =>
			block.kind === 'text' ? { ...block, text } : block
		);
	}

	protected updateTextBlockToken(index: number, token: ConditionTextToken) {
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

	protected conditionTextPreview() {
		const draft = this.draft();

		if (!draft) {
			return '';
		}

		return renderConditionText(draft);
	}

	protected needsEffectTarget(scope: ConditionEffectScope) {
		return scope === 'characteristic' || scope === 'skill';
	}

	protected targetOptions(scope: ConditionEffectScope) {
		if (scope === 'characteristic') {
			return this.characteristicOptions();
		}

		if (scope === 'skill') {
			return this.skillOptions();
		}

		return [];
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
			durationType: draft.durationType,
			repeatLevelMode: draft.repeatLevelMode,
			repeatDurationMode: draft.repeatDurationMode,
			maxLevel: draft.maxLevel,
			removalMethods: draft.removalMethods,
			effects: draft.effects.map(toConditionEffectCommand),
			textBlocks: draft.textBlocks.map((block, sortOrder) => ({
				...block,
				sortOrder
			})),
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
					error instanceof Error
						? error.message
						: 'Не удалось сохранить состояние.'
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

		forkJoin({
			conditions: this.repository.loadCatalog(),
			attributes: this.attributesRepository.loadAdminCatalog(),
			skills: this.skillsRepository.loadAdminCatalog()
		})
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => {
					this.conditions.set(catalog.conditions.conditions);
					this.characteristics.set(catalog.attributes.characteristics);
					this.skills.set(catalog.skills.skills);
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
			durationType: condition.durationType,
			repeatLevelMode: condition.repeatLevelMode,
			repeatDurationMode: condition.repeatDurationMode,
			maxLevel: condition.maxLevel,
			removalMethods: condition.removalMethods,
			effects: condition.effects.map((effect, index) => ({
				type: effect.type,
				scope: effect.scope,
				value: effect.value ?? null,
				targetId: readConfigString(effect.config, 'targetId') || null,
				timing: readEffectTiming(effect.config),
				ruleText: readConfigString(effect.config, 'text'),
				sortOrder: effect.sortOrder ?? index
			})),
			textBlocks: normalizeConditionTextBlocks(condition.textBlocks),
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

	private patchEffect(index: number, patch: Partial<ConditionEffectDraft>) {
		this.draft.update(draft => {
			if (!draft) {
				return draft;
			}

			return {
				...draft,
				effects: draft.effects.map((effect, currentIndex) =>
					currentIndex === index ? { ...effect, ...patch } : effect
				)
			};
		});
	}

	private appendTextBlock(block: ConditionTextBlock) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({ textBlocks: [...draft.textBlocks, block] });
	}

	private patchTextBlock(
		index: number,
		update: (block: ConditionTextBlock) => ConditionTextBlock
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
						error instanceof Error
							? error.message
							: 'Не удалось удалить состояние.'
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
		durationType: 'until_owner_next_activation',
		repeatLevelMode: 'keep_highest',
		repeatDurationMode: 'keep_highest',
		maxLevel: 1,
		removalMethods: ['automatic'],
		effects: [],
		textBlocks: createDefaultTextBlocks(),
		isActive: true,
		sortOrder: 0
	};
}

function draftSignature(draft: ConditionDraft | null): string {
	return JSON.stringify(draft ?? null);
}

function parseConditionImport(text: string):
	| {
			ok: true;
			value: Partial<ConditionDraft>;
	  }
	| { ok: false; message: string } {
	const normalized = text.trim();

	if (!normalized) {
		return { ok: false, message: 'JSON состояния пустой.' };
	}

	try {
		const value: unknown = JSON.parse(normalized);

		if (!isRecord(value)) {
			return { ok: false, message: 'JSON состояния должен быть объектом.' };
		}

		return { ok: true, value: normalizeImportedCondition(value) };
	} catch {
		return { ok: false, message: 'JSON состояния не удалось прочитать.' };
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeImportedCondition(
	value: Record<string, unknown>
): Partial<ConditionDraft> {
	return {
		name: readOptionalString(value, 'name') ?? '',
		description: readOptionalString(value, 'description') ?? '',
		durationType: readOption(
			value,
			'durationType',
			DURATION_OPTIONS,
			'until_owner_next_activation'
		),
		repeatLevelMode: readOption(
			value,
			'repeatLevelMode',
			REPEAT_LEVEL_OPTIONS,
			'keep_highest'
		),
		repeatDurationMode: readOption(
			value,
			'repeatDurationMode',
			REPEAT_DURATION_OPTIONS,
			'keep_highest'
		),
		maxLevel: readPositiveNumber(value, 'maxLevel', 1),
		removalMethods: readOptionArray(value, 'removalMethods', REMOVAL_OPTIONS, [
			'automatic'
		]),
		effects: readImportedEffects(value),
		textBlocks: readImportedTextBlocks(value),
		isActive: readOptionalBoolean(value, 'isActive') ?? true,
		sortOrder: readNonNegativeNumber(value, 'sortOrder', 0)
	};
}

function readImportedTextBlocks(
	value: Record<string, unknown>
): ConditionTextBlock[] {
	const textBlocks = value['textBlocks'];

	if (!Array.isArray(textBlocks)) {
		return createDefaultTextBlocks();
	}

	const normalized: ConditionTextBlock[] = [];

	textBlocks.forEach((item, index) => {
		if (!isRecord(item)) {
			return;
		}

		const sortOrder = readNonNegativeNumber(item, 'sortOrder', index);
		const isActive = readOptionalBoolean(item, 'isActive') ?? true;

		if (item['kind'] === 'text') {
			normalized.push({
				kind: 'text',
				text: readOptionalString(item, 'text') ?? '',
				isActive,
				sortOrder
			});
			return;
		}

		const token = readOption(item, 'token', TEXT_TOKEN_OPTIONS, 'effects');

		if (item['kind'] === 'token') {
			normalized.push({
				kind: 'token',
				token,
				isActive,
				sortOrder
			});
		}
	});

	return normalized.length ? normalized : createDefaultTextBlocks();
}

function readImportedEffects(
	value: Record<string, unknown>
): ConditionEffectDraft[] {
	const effects = value['effects'];

	if (!Array.isArray(effects)) {
		return [];
	}

	return effects.flatMap((item, index) => {
		if (!isRecord(item)) {
			return [];
		}

		const config = isRecord(item['config']) ? item['config'] : {};

		return [
			{
				type: readOption(
					item,
					'type',
					EFFECT_TYPE_OPTIONS,
					'dice_pool_modifier'
				),
				scope: readOption(item, 'scope', EFFECT_SCOPE_OPTIONS, 'all_checks'),
				value: readOptionalNumber(item, 'value'),
				targetId: readConfigString(config, 'targetId') || null,
				timing: readEffectTiming(config),
				ruleText: readConfigString(config, 'text'),
				sortOrder: readNonNegativeNumber(item, 'sortOrder', index)
			}
		];
	});
}

function toConditionEffectCommand(effect: ConditionEffectDraft) {
	const config: Record<string, unknown> = {};

	if (
		(effect.scope === 'characteristic' || effect.scope === 'skill') &&
		effect.targetId
	) {
		config['targetId'] = effect.targetId;
	}

	if (effect.type === 'periodic_damage') {
		config['timing'] = effect.timing;
	}

	if (effect.type === 'special_rule' && effect.ruleText.trim()) {
		config['text'] = effect.ruleText.trim();
	}

	return {
		type: effect.type,
		scope: effect.scope,
		value: effect.value ?? undefined,
		config,
		sortOrder: effect.sortOrder
	};
}

function readOption<TValue extends string>(
	value: Record<string, unknown>,
	key: string,
	options: SelectOption<TValue>[],
	fallback: TValue
): TValue {
	const candidate = value[key];

	return typeof candidate === 'string' &&
		options.some(option => option.value === candidate)
		? (candidate as TValue)
		: fallback;
}

function readOptionArray<TValue extends string>(
	value: Record<string, unknown>,
	key: string,
	options: SelectOption<TValue>[],
	fallback: TValue[]
): TValue[] {
	const candidates = value[key];

	if (!Array.isArray(candidates)) {
		return fallback;
	}

	const allowed = new Set(options.map(option => option.value));
	const result = candidates.filter(
		(candidate): candidate is TValue =>
			typeof candidate === 'string' && allowed.has(candidate as TValue)
	);

	return result.length ? result : fallback;
}

function readOptionalString(
	value: Record<string, unknown>,
	key: string
): string | undefined {
	const candidate = value[key];
	return typeof candidate === 'string' ? candidate : undefined;
}

function readOptionalBoolean(
	value: Record<string, unknown>,
	key: string
): boolean | undefined {
	const candidate = value[key];
	return typeof candidate === 'boolean' ? candidate : undefined;
}

function readOptionalNumber(
	value: Record<string, unknown>,
	key: string
): number | null {
	const candidate = value[key];
	return typeof candidate === 'number' && Number.isFinite(candidate)
		? candidate
		: null;
}

function readPositiveNumber(
	value: Record<string, unknown>,
	key: string,
	fallback: number
): number {
	const candidate = readOptionalNumber(value, key);
	return candidate === null ? fallback : Math.max(1, Math.trunc(candidate));
}

function readNonNegativeNumber(
	value: Record<string, unknown>,
	key: string,
	fallback: number
): number {
	const candidate = readOptionalNumber(value, key);
	return candidate === null ? fallback : Math.max(0, Math.trunc(candidate));
}

function readConfigString(
	config: Record<string, unknown>,
	key: string
): string {
	const value = config[key];
	return typeof value === 'string' ? value : '';
}

function readEffectTiming(config: Record<string, unknown>): EffectTiming {
	return readOption(
		config,
		'timing',
		EFFECT_TIMING_OPTIONS,
		'owner_activation_start'
	);
}

function buildImportExample() {
	return {
		name: 'Ослепление',
		description:
			'Цель хуже видит и получает штрафы к действиям, зависящим от зрения.',
		durationType: 'until_next_round_start',
		repeatLevelMode: 'keep_highest',
		repeatDurationMode: 'keep_highest',
		maxLevel: 1,
		removalMethods: ['automatic', 'successful_check'],
		effects: [
			{
				type: 'dice_pool_modifier',
				scope: 'attacks',
				value: -2,
				sortOrder: 0
			}
		],
		textBlocks: [
			{ kind: 'token', token: 'description', sortOrder: 0 },
			{ kind: 'text', text: ' ', sortOrder: 1 },
			{ kind: 'token', token: 'effects', sortOrder: 2 },
			{ kind: 'text', text: ' Длительность: ', sortOrder: 3 },
			{ kind: 'token', token: 'duration', sortOrder: 4 }
		],
		isActive: true,
		sortOrder: 0
	};
}

function createDefaultTextBlocks(): ConditionTextBlock[] {
	return [
		{ kind: 'token', token: 'description', isActive: true, sortOrder: 0 },
		{ kind: 'text', text: ' ', isActive: true, sortOrder: 1 },
		{ kind: 'token', token: 'effects', isActive: true, sortOrder: 2 },
		{
			kind: 'text',
			text: ' Длительность: ',
			isActive: true,
			sortOrder: 3
		},
		{ kind: 'token', token: 'duration', isActive: true, sortOrder: 4 }
	];
}

function normalizeConditionTextBlocks(
	textBlocks: ConditionTextBlock[]
): ConditionTextBlock[] {
	return textBlocks
		.filter(block => block.kind === 'text' || block.kind === 'token')
		.map((block, sortOrder) => ({ ...block, sortOrder }));
}

function renderConditionText(draft: ConditionDraft): string {
	const text = draft.textBlocks
		.filter(block => block.isActive)
		.sort((first, second) => first.sortOrder - second.sortOrder)
		.map(block =>
			block.kind === 'text'
				? block.text
				: renderConditionTextToken(draft, block.token)
		)
		.join('')
		.replace(/[ \t]+/g, ' ')
		.replace(/ *\n */g, '\n')
		.trim();

	return text || 'Текст для игрока пока не настроен.';
}

function renderConditionTextToken(
	draft: ConditionDraft,
	token: ConditionTextToken
): string {
	switch (token) {
		case 'conditionName':
			return draft.name || 'Состояние';
		case 'description':
			return draft.description || 'Описание не заполнено.';
		case 'duration':
			return optionLabel(DURATION_OPTIONS, draft.durationType);
		case 'currentLevel':
			return '{уровень}';
		case 'maxLevel':
			return String(draft.maxLevel);
		case 'remainingDuration':
			return '{оставшаяся длительность}';
		case 'removalMethods':
			return draft.removalMethods
				.map(method => optionLabel(REMOVAL_OPTIONS, method))
				.join(', ');
		case 'effects':
			return renderConditionEffects(draft);
		case 'source':
			return '{источник состояния}';
		case 'bodyPart':
			return '{часть тела}';
	}
}

function renderConditionEffects(draft: ConditionDraft): string {
	const effects = draft.effects;

	if (!effects.length) {
		return 'Механические эффекты не настроены.';
	}

	return effects
		.sort((first, second) => first.sortOrder - second.sortOrder)
		.map(effect => renderConditionEffect(draft, effect))
		.join('; ');
}

function renderConditionEffect(
	draft: ConditionDraft,
	effect: ConditionEffectDraft
): string {
	const scope = effectScopeText(effect.scope);
	const value = effect.value ?? 0;

	switch (effect.type) {
		case 'dice_pool_modifier':
			return `${modifierText(value, 'кубик', 'кубика', 'кубиков')} ${scope}.`;
		case 'potential_cost_modifier':
			return `${modifierText(value, 'Потенциал', 'Потенциала', 'Потенциала')} к стоимости действий ${scope}.`;
		case 'periodic_damage':
			if (draft.maxLevel > 1 && value === 1) {
				return `${timingText(effect.timing)} владелец получает урон, равный текущему уровню состояния.`;
			}

			return `${timingText(effect.timing)} владелец получает ${damageText(value)}.`;
		case 'action_forbidden':
			return `Владелец не может выполнять действия ${scope}.`;
		case 'reaction_forbidden':
			return `Владелец не может выполнять реакции ${scope}.`;
		case 'speed_modifier':
			return `${modifierText(value, 'метр', 'метра', 'метров')} к перемещению.`;
		case 'defense_modifier':
			return `${modifierText(value, 'пункт', 'пункта', 'пунктов')} к защите.`;
		case 'incoming_damage_modifier':
			return `${modifierText(value, 'урон', 'урона', 'урона')} к получаемому урону.`;
		case 'special_rule':
			return effect.ruleText.trim() || 'Действует особое правило состояния.';
	}
}

function effectScopeText(scope: ConditionEffectScope): string {
	switch (scope) {
		case 'all_checks':
			return 'ко всем проверкам';
		case 'mind_checks':
			return 'к проверкам Разума';
		case 'body_checks':
			return 'к проверкам Тела';
		case 'characteristic':
			return 'к проверкам выбранной характеристики';
		case 'skill':
			return 'к проверкам выбранного навыка';
		case 'attacks':
			return 'к атакам';
		case 'dodge':
			return 'к уклонению';
		case 'parry':
			return 'к парированию';
		case 'movement':
			return 'к перемещению';
	}
}

function timingText(timing: EffectTiming): string {
	switch (timing) {
		case 'owner_activation_start':
			return 'В начале активации владельца';
		case 'owner_activation_end':
			return 'В конце активации владельца';
		case 'round_start':
			return 'В начале раунда';
		case 'round_end':
			return 'В конце раунда';
	}
}

function modifierText(
	value: number,
	one: string,
	few: string,
	many: string
): string {
	const absValue = Math.abs(value);
	const word = pluralizeRu(absValue, one, few, many);
	const sign = value > 0 ? '+' : value < 0 ? '-' : '';

	if (value === 0) {
		return `Нет изменения ${word}`;
	}

	return `${sign}${absValue} ${word}`;
}

function damageText(value: number): string {
	const damage = Math.max(1, Math.abs(value));
	return `${damage} ${pluralizeRu(damage, 'урон', 'урона', 'урона')}`;
}

function pluralizeRu(value: number, one: string, few: string, many: string) {
	const mod10 = value % 10;
	const mod100 = value % 100;

	if (mod10 === 1 && mod100 !== 11) {
		return one;
	}

	if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
		return few;
	}

	return many;
}

function optionLabel<TValue extends string>(
	options: SelectOption<TValue>[],
	value: TValue
): string {
	return options.find(option => option.value === value)?.label ?? value;
}
