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
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { CONDITIONS_REPOSITORY } from '../../../../conditions/data/conditions-repository.port';
import { Condition } from '../../../../conditions/domain/conditions.models';
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
	description: string;
	mechanic: CombatIntentMechanicDraft;
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

type CombatIntentScenarioStep =
	| 'availability'
	| 'checks'
	| 'success'
	| 'effects'
	| 'failure';
type CombatIntentRollKind = 'none' | 'opposed_attack' | 'check';
type CombatIntentHitSuccessMode = 'fixed' | 'by_size_difference';
type CombatIntentHitZoneKind =
	| 'none'
	| 'random_main_zone'
	| 'targeted_main_zone'
	| 'targeted_subzone';

interface CombatIntentMechanicDraft {
	version: number;
	requiredInputs: string[];
	optionalInputs: string[];
	rollKind: CombatIntentRollKind;
	usesAttackProfileDice: boolean;
	allowDodgeDefense: boolean;
	allowParryDefense: boolean;
	minCleanSuccessesMode: CombatIntentHitSuccessMode;
	minCleanSuccesses: number;
	onNoCleanSuccesses: string;
	damageEnabled: boolean;
	damageFormula: string;
	baseDamageOnlyOnHit: boolean;
	damageType: string;
	armorApplies: boolean;
	armorSource: string;
	armorTiming: string;
	hitZoneKind: CombatIntentHitZoneKind;
	hitZoneSource: string;
	hitZoneUsesWeights: boolean;
	sizeRequirementEnabled: boolean;
	unavailableIfTargetLargerBy: number;
	minCleanSuccessesIfTargetSameOrSmaller: number;
	minCleanSuccessesIfTargetLargerByOne: number;
	conditionRequirementSlug: string;
	resultConditionSlug: string;
	resultConditionName: string;
	resultDamage: string;
	healthDamage: boolean;
	canCauseZoneTrauma: boolean;
}

const MECHANIC_INPUT_OPTIONS: SelectOption<string>[] = [
	{ label: 'Атакующий', value: 'attacker' },
	{ label: 'Цель', value: 'target' },
	{ label: 'Оружие', value: 'weapon' },
	{ label: 'Естественная атака', value: 'naturalAttack' },
	{ label: 'Профиль атаки', value: 'attackProfile' },
	{ label: 'Навык атаки', value: 'attackSkill' },
	{ label: 'Характеристика атаки', value: 'attackCharacteristic' },
	{ label: 'Типы урона', value: 'damageTypes' },
	{ label: 'Выбранный тип урона', value: 'selectedDamageType' },
	{ label: 'Доступные защиты цели', value: 'defenseOptions' },
	{ label: 'Анатомия цели', value: 'targetAnatomy' },
	{ label: 'Броня зон цели', value: 'targetArmorByZone' },
	{ label: 'Размер атакующего', value: 'attackerSize' },
	{ label: 'Размер цели', value: 'targetSize' },
	{ label: 'Чистые успехи', value: 'cleanSuccesses' },
	{ label: 'Разница размеров', value: 'sizeDifference' }
];

const ROLL_KIND_OPTIONS: SelectOption<CombatIntentRollKind>[] = [
	{ label: 'Нет броска', value: 'none' },
	{ label: 'Встречная атака', value: 'opposed_attack' },
	{ label: 'Обычная проверка', value: 'check' }
];

const HIT_SUCCESS_MODE_OPTIONS: SelectOption<CombatIntentHitSuccessMode>[] = [
	{ label: 'Фиксированно', value: 'fixed' },
	{ label: 'По разнице размеров', value: 'by_size_difference' }
];

const HIT_ZONE_KIND_OPTIONS: SelectOption<CombatIntentHitZoneKind>[] = [
	{ label: 'Не используется', value: 'none' },
	{ label: 'Случайная основная зона', value: 'random_main_zone' },
	{ label: 'Выбранная основная зона', value: 'targeted_main_zone' },
	{ label: 'Выбранная подзона', value: 'targeted_subzone' }
];

const SCENARIO_STEP_OPTIONS: SelectOption<CombatIntentScenarioStep>[] = [
	{ label: 'Доступность', value: 'availability' },
	{ label: 'Проверки', value: 'checks' },
	{ label: 'Успех', value: 'success' },
	{ label: 'Эффекты', value: 'effects' },
	{ label: 'Провал', value: 'failure' }
];

const NO_CLEAN_SUCCESSES_OPTIONS: SelectOption<string>[] = [
	{ label: 'Атака промахивается', value: 'miss' },
	{ label: 'Нет эффекта', value: 'no_effect' }
];

const DAMAGE_FORMULA_OPTIONS: SelectOption<string>[] = [
	{
		label: 'Чистые успехи + базовый урон атаки',
		value: 'cleanSuccesses + attackProfile.baseDamage'
	},
	{ label: 'Только чистые успехи', value: 'cleanSuccesses' },
	{ label: 'Только базовый урон атаки', value: 'attackProfile.baseDamage' },
	{ label: 'Урон не рассчитывается', value: '0' }
];

const DAMAGE_TYPE_SOURCE_OPTIONS: SelectOption<string>[] = [
	{ label: 'Выбранный тип урона атаки', value: 'selectedDamageType' },
	{
		label: 'Первый доступный тип урона атаки',
		value: 'attackProfile.damageTypes[0]'
	},
	{ label: 'Без типа урона', value: 'none' }
];

const RESULT_DAMAGE_OPTIONS: SelectOption<string>[] = [
	{ label: 'Не наносит отдельный урон', value: '' },
	{ label: '1 урон', value: '1' },
	{ label: 'Чистые успехи', value: 'cleanSuccesses' },
	{ label: 'Уровень состояния', value: 'condition.level' },
	{
		label: 'Только если атака также наносит урон',
		value: 'only_if_attack_also_has_damage_rule'
	}
];

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
	{ label: 'Расчёт урона', value: 'damageFormula' },
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
		Checkbox,
		ConfirmDialog,
		IconField,
		InputIcon,
		InputNumber,
		InputText,
		Select,
		Tag,
		Tab,
		TabList,
		TabPanel,
		TabPanels,
		Tabs,
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
	private readonly conditionsRepository = inject(CONDITIONS_REPOSITORY);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Боевые намерения' }
	];
	protected readonly mechanicInputOptions = MECHANIC_INPUT_OPTIONS;
	protected readonly rollKindOptions = ROLL_KIND_OPTIONS;
	protected readonly hitSuccessModeOptions = HIT_SUCCESS_MODE_OPTIONS;
	protected readonly hitZoneKindOptions = HIT_ZONE_KIND_OPTIONS;
	protected readonly scenarioStepOptions = SCENARIO_STEP_OPTIONS;
	protected readonly noCleanSuccessesOptions = NO_CLEAN_SUCCESSES_OPTIONS;
	protected readonly damageFormulaOptions = DAMAGE_FORMULA_OPTIONS;
	protected readonly damageTypeSourceOptions = DAMAGE_TYPE_SOURCE_OPTIONS;
	protected readonly resultDamageOptions = RESULT_DAMAGE_OPTIONS;
	protected readonly textTokenOptions = TEXT_TOKEN_OPTIONS;
	protected readonly selectedCombatIntentId = signal<string | null>(null);
	protected readonly selectedScenarioStep =
		signal<CombatIntentScenarioStep>('availability');
	protected readonly searchQuery = signal('');
	protected readonly combatIntents = signal<CombatIntent[]>([]);
	protected readonly conditions = signal<Condition[]>([]);
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
	protected readonly conditionOptions = computed<SelectOption<string>[]>(() =>
		this.conditions()
			.filter(condition => condition.isActive)
			.sort(compareConditions)
			.map(condition => ({
				label: condition.name,
				value: condition.slug
			}))
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

	protected updateDraftDescription(description: string) {
		this.patchDraft({ description });
	}

	protected updateDraftSortOrder(sortOrder: number | null) {
		this.patchDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected updateDraftActive(isActive: boolean) {
		this.patchDraft({ isActive });
	}

	protected selectScenarioStep(step: CombatIntentScenarioStep) {
		this.selectedScenarioStep.set(step);
	}

	protected hasMechanicInput(input: string, required: boolean) {
		const mechanic = this.draft()?.mechanic;
		const inputs = required
			? mechanic?.requiredInputs
			: mechanic?.optionalInputs;

		return inputs?.includes(input) ?? false;
	}

	protected toggleMechanicInput(
		input: string,
		required: boolean,
		enabled: boolean
	) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		const source = required
			? draft.mechanic.requiredInputs
			: draft.mechanic.optionalInputs;
		const opposite = required
			? draft.mechanic.optionalInputs
			: draft.mechanic.requiredInputs;
		const nextSource = enabled
			? [...new Set([...source, input])]
			: source.filter(item => item !== input);
		const nextOpposite = enabled
			? opposite.filter(item => item !== input)
			: opposite;

		this.patchMechanic({
			requiredInputs: required ? nextSource : nextOpposite,
			optionalInputs: required ? nextOpposite : nextSource
		});
	}

	protected updateMechanicRollKind(rollKind: CombatIntentRollKind) {
		this.patchMechanic({ rollKind });
	}

	protected updateMechanicUsesAttackProfileDice(
		usesAttackProfileDice: boolean
	) {
		this.patchMechanic({ usesAttackProfileDice });
	}

	protected updateMechanicAllowDodgeDefense(allowDodgeDefense: boolean) {
		this.patchMechanic({ allowDodgeDefense });
	}

	protected updateMechanicAllowParryDefense(allowParryDefense: boolean) {
		this.patchMechanic({ allowParryDefense });
	}

	protected updateMechanicHitSuccessMode(
		minCleanSuccessesMode: CombatIntentHitSuccessMode
	) {
		this.patchMechanic({ minCleanSuccessesMode });
	}

	protected updateMechanicMinCleanSuccesses(minCleanSuccesses: number | null) {
		this.patchMechanic({ minCleanSuccesses: minCleanSuccesses ?? 1 });
	}

	protected updateMechanicOnNoCleanSuccesses(onNoCleanSuccesses: string) {
		this.patchMechanic({ onNoCleanSuccesses });
	}

	protected updateMechanicDamageEnabled(damageEnabled: boolean) {
		this.patchMechanic({ damageEnabled });
	}

	protected updateMechanicDamageFormula(damageFormula: string) {
		this.patchMechanic({ damageFormula });
	}

	protected updateMechanicBaseDamageOnlyOnHit(baseDamageOnlyOnHit: boolean) {
		this.patchMechanic({ baseDamageOnlyOnHit });
	}

	protected updateMechanicDamageType(damageType: string) {
		this.patchMechanic({ damageType });
	}

	protected updateMechanicArmorApplies(armorApplies: boolean) {
		this.patchMechanic({ armorApplies });
	}

	protected updateMechanicHitZoneKind(hitZoneKind: CombatIntentHitZoneKind) {
		this.patchMechanic({ hitZoneKind });
	}

	protected updateMechanicHitZoneUsesWeights(hitZoneUsesWeights: boolean) {
		this.patchMechanic({ hitZoneUsesWeights });
	}

	protected updateMechanicSizeRequirementEnabled(
		sizeRequirementEnabled: boolean
	) {
		this.patchMechanic({ sizeRequirementEnabled });
	}

	protected updateMechanicUnavailableIfTargetLargerBy(
		unavailableIfTargetLargerBy: number | null
	) {
		this.patchMechanic({
			unavailableIfTargetLargerBy: unavailableIfTargetLargerBy ?? 2
		});
	}

	protected updateMechanicMinCleanSuccessesIfTargetSameOrSmaller(
		minCleanSuccessesIfTargetSameOrSmaller: number | null
	) {
		this.patchMechanic({
			minCleanSuccessesIfTargetSameOrSmaller:
				minCleanSuccessesIfTargetSameOrSmaller ?? 1
		});
	}

	protected updateMechanicMinCleanSuccessesIfTargetLargerByOne(
		minCleanSuccessesIfTargetLargerByOne: number | null
	) {
		this.patchMechanic({
			minCleanSuccessesIfTargetLargerByOne:
				minCleanSuccessesIfTargetLargerByOne ?? 2
		});
	}

	protected updateMechanicConditionRequirementSlug(
		conditionRequirementSlug: string | null
	) {
		this.patchMechanic({
			conditionRequirementSlug: conditionRequirementSlug ?? ''
		});
	}

	protected updateMechanicResultConditionSlug(
		resultConditionSlug: string | null
	) {
		const condition = resultConditionSlug
			? this.conditions().find(item => item.slug === resultConditionSlug)
			: null;

		this.patchMechanic({
			resultConditionSlug: resultConditionSlug ?? '',
			resultConditionName: condition?.name ?? ''
		});
	}

	protected updateMechanicResultDamage(resultDamage: string) {
		this.patchMechanic({ resultDamage });
	}

	protected updateMechanicHealthDamage(healthDamage: boolean) {
		this.patchMechanic({ healthDamage });
	}

	protected updateMechanicCanCauseZoneTrauma(canCauseZoneTrauma: boolean) {
		this.patchMechanic({ canCauseZoneTrauma });
	}

	protected conditionName(slug: string) {
		return (
			this.conditions().find(condition => condition.slug === slug)?.name ||
			'Не выбрано'
		);
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
			description: draft.description.trim(),
			mechanic: buildMechanic(draft.mechanic),
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

		forkJoin({
			combatIntents: this.repository.loadCatalog(),
			conditions: this.conditionsRepository.loadCatalog()
		})
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => {
					this.combatIntents.set(catalog.combatIntents.combatIntents);
					this.conditions.set(catalog.conditions.conditions);
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
			description: combatIntent.description,
			mechanic: parseMechanic(combatIntent.mechanic),
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

	private patchMechanic(patch: Partial<CombatIntentMechanicDraft>) {
		this.draft.update(draft =>
			draft
				? {
						...draft,
						mechanic: {
							...draft.mechanic,
							...patch
						}
					}
				: draft
		);
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
		description: '',
		mechanic: createDefaultMechanic(),
		textBlocks: createDefaultTextBlocks(),
		isActive: true,
		sortOrder: 0
	};
}

function createDefaultMechanic(): CombatIntentMechanicDraft {
	return {
		version: 1,
		requiredInputs: [
			'attacker',
			'target',
			'attackProfile',
			'attackSkill',
			'attackCharacteristic',
			'defenseOptions'
		],
		optionalInputs: ['weapon', 'naturalAttack', 'cleanSuccesses'],
		rollKind: 'opposed_attack',
		usesAttackProfileDice: true,
		allowDodgeDefense: true,
		allowParryDefense: true,
		minCleanSuccessesMode: 'fixed',
		minCleanSuccesses: 1,
		onNoCleanSuccesses: 'miss',
		damageEnabled: false,
		damageFormula: 'cleanSuccesses + attackProfile.baseDamage',
		baseDamageOnlyOnHit: true,
		damageType: 'selectedDamageType',
		armorApplies: false,
		armorSource: 'targetArmorByHitZone',
		armorTiming: 'after_total_damage',
		hitZoneKind: 'none',
		hitZoneSource: 'targetAnatomy',
		hitZoneUsesWeights: true,
		sizeRequirementEnabled: false,
		unavailableIfTargetLargerBy: 2,
		minCleanSuccessesIfTargetSameOrSmaller: 1,
		minCleanSuccessesIfTargetLargerByOne: 2,
		conditionRequirementSlug: '',
		resultConditionSlug: '',
		resultConditionName: '',
		resultDamage: '',
		healthDamage: false,
		canCauseZoneTrauma: false
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
			return renderDefenseOptions(draft.mechanic);
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

function parseMechanic(
	mechanic: Record<string, unknown>
): CombatIntentMechanicDraft {
	const draft = createDefaultMechanic();
	const inputs = isRecord(mechanic['inputs']) ? mechanic['inputs'] : {};
	const actions = Array.isArray(mechanic['actions'])
		? mechanic['actions'].filter(isRecord)
		: [];
	const rollAction = actions.find(action => action['kind'] === 'attack_roll');
	const hitAction = actions.find(action => action['kind'] === 'hit_check');
	const damageAction = actions.find(action => action['kind'] === 'damage');
	const hitZoneAction = actions.find(action => action['kind'] === 'hit_zone');
	const sizeLimitAction = actions.find(
		action => action['kind'] === 'target_size_limit'
	);
	const conditionRequirementAction = actions.find(
		action =>
			action['kind'] === 'target_condition_absence' ||
			action['kind'] === 'target_condition_requirement'
	);
	const resultAction = actions.find(action => action['kind'] === 'result');
	const roll = isRecord(mechanic['roll']) ? mechanic['roll'] : {};
	const effectiveRoll = rollAction ?? roll;
	const attackDicePool = isRecord(effectiveRoll['attackDicePool'])
		? effectiveRoll['attackDicePool']
		: {};
	const hit = isRecord(mechanic['hit']) ? mechanic['hit'] : {};
	const effectiveHit = hitAction ?? hit;
	const damage = isRecord(mechanic['damage']) ? mechanic['damage'] : {};
	const effectiveDamage = damageAction ?? damage;
	const armor = isRecord(damage['armor']) ? damage['armor'] : {};
	const effectiveArmor = isRecord(effectiveDamage['armor'])
		? effectiveDamage['armor']
		: armor;
	const hitZone = isRecord(mechanic['hitZone']) ? mechanic['hitZone'] : {};
	const effectiveHitZone = hitZoneAction ?? hitZone;
	const result = isRecord(mechanic['result']) ? mechanic['result'] : {};
	const effectiveResult = resultAction ?? result;
	const requirements = Array.isArray(mechanic['requirements'])
		? mechanic['requirements'].filter(isRecord)
		: [];
	const sizeRequirement = requirements.find(
		requirement => requirement['kind'] === 'target_size_limit'
	);
	const effectiveSizeRequirement = sizeLimitAction ?? sizeRequirement;
	const conditionRequirement = requirements.find(
		requirement => requirement['kind'] === 'target_can_receive_condition'
	);
	const effectiveConditionRequirement =
		conditionRequirementAction ?? conditionRequirement;

	return {
		...draft,
		version: readNumber(mechanic['version'], draft.version),
		requiredInputs: readStringArray(inputs['required'], draft.requiredInputs),
		optionalInputs: readStringArray(inputs['optional'], draft.optionalInputs),
		rollKind: readRollKind(
			effectiveRoll['rollKind'] ?? effectiveRoll['kind'],
			draft.rollKind
		),
		usesAttackProfileDice:
			attackDicePool['characteristic'] === 'from_attack_profile' &&
			attackDicePool['skill'] === 'from_attack_profile',
		...parseDefenseOptions(effectiveRoll['defense']),
		minCleanSuccessesMode:
			effectiveHit['minCleanSuccesses'] === 'by_size_difference'
				? 'by_size_difference'
				: 'fixed',
		minCleanSuccesses: readNumber(
			effectiveHit['minCleanSuccesses'] ??
				effectiveHit['defaultMinCleanSuccesses'],
			draft.minCleanSuccesses
		),
		onNoCleanSuccesses: readString(
			effectiveHit['onNoCleanSuccesses'],
			draft.onNoCleanSuccesses
		),
		damageEnabled: damageAction
			? readBoolean(damageAction['isActive'], true)
			: isRecord(mechanic['damage']),
		damageFormula: readString(effectiveDamage['formula'], draft.damageFormula),
		baseDamageOnlyOnHit: readBoolean(
			effectiveDamage['baseDamageAppliesOnlyOnHit'],
			draft.baseDamageOnlyOnHit
		),
		damageType: readString(effectiveDamage['damageType'], draft.damageType),
		armorApplies: readBoolean(effectiveArmor['applies'], draft.armorApplies),
		armorSource: readString(effectiveArmor['source'], draft.armorSource),
		armorTiming: readString(effectiveArmor['timing'], draft.armorTiming),
		hitZoneKind: hitZoneAction
			? readHitZoneKind(hitZoneAction['zoneKind'], draft.hitZoneKind)
			: readHitZoneKind(hitZone['kind'], draft.hitZoneKind),
		hitZoneSource: readString(effectiveHitZone['source'], draft.hitZoneSource),
		hitZoneUsesWeights: readBoolean(
			effectiveHitZone['usesWeights'],
			draft.hitZoneUsesWeights
		),
		sizeRequirementEnabled: sizeLimitAction
			? readBoolean(sizeLimitAction['isActive'], true)
			: Boolean(sizeRequirement),
		unavailableIfTargetLargerBy: readNumber(
			effectiveSizeRequirement?.['unavailableIfTargetLargerBy'],
			draft.unavailableIfTargetLargerBy
		),
		minCleanSuccessesIfTargetSameOrSmaller: readNumber(
			effectiveSizeRequirement?.['minCleanSuccessesIfTargetSameOrSmaller'],
			draft.minCleanSuccessesIfTargetSameOrSmaller
		),
		minCleanSuccessesIfTargetLargerByOne: readNumber(
			effectiveSizeRequirement?.['minCleanSuccessesIfTargetLargerByOne'],
			draft.minCleanSuccessesIfTargetLargerByOne
		),
		conditionRequirementSlug: readString(
			effectiveConditionRequirement?.['condition'],
			draft.conditionRequirementSlug
		),
		resultConditionSlug: readString(
			effectiveResult['condition'],
			draft.resultConditionSlug
		),
		resultConditionName: readString(
			effectiveResult['conditionName'],
			draft.resultConditionName
		),
		resultDamage: readString(effectiveResult['damage'], draft.resultDamage),
		healthDamage: readBoolean(
			effectiveResult['healthDamage'],
			draft.healthDamage
		),
		canCauseZoneTrauma: readBoolean(
			effectiveResult['canCauseZoneTrauma'],
			draft.canCauseZoneTrauma
		)
	};
}

function buildMechanic(
	draft: CombatIntentMechanicDraft
): Record<string, unknown> {
	return {
		version: draft.version,
		inputs: {
			required: draft.requiredInputs,
			optional: draft.optionalInputs
		},
		actions: buildMechanicActions(draft)
	};
}

function buildMechanicActions(
	draft: CombatIntentMechanicDraft
): Record<string, unknown>[] {
	const actions: Record<string, unknown>[] = [
		{
			kind: 'attack_roll',
			label: 'Бросок и защита',
			rollKind: draft.rollKind,
			isActive: draft.rollKind !== 'none',
			sortOrder: 0,
			attackDicePool: draft.usesAttackProfileDice
				? {
						characteristic: 'from_attack_profile',
						skill: 'from_attack_profile'
					}
				: undefined,
			defense: buildDefenseConfig(draft)
		},
		{
			kind: 'hit_check',
			label: 'Попадание',
			minCleanSuccesses:
				draft.minCleanSuccessesMode === 'by_size_difference'
					? 'by_size_difference'
					: draft.minCleanSuccesses,
			defaultMinCleanSuccesses: draft.minCleanSuccesses,
			onNoCleanSuccesses: draft.onNoCleanSuccesses,
			sortOrder: 1,
			isActive: true
		},
		{
			kind: 'damage',
			label: 'Урон',
			formula: draft.damageFormula,
			baseDamageAppliesOnlyOnHit: draft.baseDamageOnlyOnHit,
			damageType: draft.damageType,
			armor: {
				applies: draft.armorApplies,
				source: draft.armorSource,
				timing: draft.armorTiming
			},
			sortOrder: 2,
			isActive: draft.damageEnabled
		},
		{
			kind: 'hit_zone',
			label: 'Зона попадания',
			zoneKind: draft.hitZoneKind,
			source: draft.hitZoneSource,
			eligibleZones:
				draft.hitZoneKind === 'random_main_zone'
					? 'main_random_hit_eligible'
					: undefined,
			usesWeights: draft.hitZoneUsesWeights,
			sortOrder: 3,
			isActive: draft.hitZoneKind !== 'none'
		},
		{
			kind: 'target_size_limit',
			label: 'Ограничение по размеру',
			source: 'creature_size_rank',
			attackerRank: 'attackerSize.rank',
			targetRank: 'targetSize.rank',
			differenceFormula: 'targetSize.rank - attackerSize.rank',
			unavailableIfTargetLargerBy: draft.unavailableIfTargetLargerBy,
			minCleanSuccessesIfTargetSameOrSmaller:
				draft.minCleanSuccessesIfTargetSameOrSmaller,
			minCleanSuccessesIfTargetLargerByOne:
				draft.minCleanSuccessesIfTargetLargerByOne,
			sortOrder: 4,
			isActive: draft.sizeRequirementEnabled
		}
	];

	if (draft.conditionRequirementSlug.trim()) {
		actions.push({
			kind: 'target_condition_absence',
			label: 'Цель не имеет состояние',
			condition: draft.conditionRequirementSlug.trim(),
			sortOrder: 5,
			isActive: true
		});
	}

	actions.push({
		kind: 'result',
		label: 'Результат',
		condition: draft.resultConditionSlug.trim() || undefined,
		conditionName: draft.resultConditionName.trim() || undefined,
		damage: draft.resultDamage.trim() || undefined,
		healthDamage: draft.healthDamage,
		canCauseZoneTrauma: draft.canCauseZoneTrauma,
		sortOrder: 6,
		isActive:
			Boolean(draft.resultConditionSlug.trim()) ||
			Boolean(draft.resultDamage.trim()) ||
			draft.healthDamage ||
			draft.canCauseZoneTrauma
	});

	return actions;
}

function buildDefenseConfig(
	draft: CombatIntentMechanicDraft
): Record<string, unknown> {
	return {
		kind: 'physical',
		options: [
			...(draft.allowDodgeDefense ? ['dodge'] : []),
			...(draft.allowParryDefense ? ['parry'] : [])
		],
		...(draft.allowParryDefense
			? {
					parry: {
						requiresAttackProfileCanBeParried: true,
						dicePool: {
							skill: 'from_parrying_weapon_profile',
							characteristic: 'from_parrying_weapon_profile'
						}
					}
				}
			: {})
	};
}

function readString(value: unknown, fallback: string) {
	return typeof value === 'string' ? value : fallback;
}

function readNumber(value: unknown, fallback: number) {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean) {
	return typeof value === 'boolean' ? value : fallback;
}

function renderDefenseOptions(mechanic: CombatIntentMechanicDraft): string {
	const options = [
		...(mechanic.allowDodgeDefense ? ['Уклонение'] : []),
		...(mechanic.allowParryDefense
			? ['Парирование, если выбранную атаку можно парировать']
			: [])
	];

	return options.length ? options.join(' или ') : 'защита недоступна';
}

function parseDefenseOptions(value: unknown): {
	allowDodgeDefense: boolean;
	allowParryDefense: boolean;
} {
	if (value === 'target_available_defense') {
		return {
			allowDodgeDefense: true,
			allowParryDefense: true
		};
	}

	if (!isRecord(value)) {
		return {
			allowDodgeDefense: true,
			allowParryDefense: true
		};
	}

	const options = Array.isArray(value['options'])
		? value['options'].filter(
				(item): item is string => typeof item === 'string'
			)
		: [];

	return {
		allowDodgeDefense: options.includes('dodge'),
		allowParryDefense: options.includes('parry')
	};
}

function readStringArray(value: unknown, fallback: string[]) {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === 'string')
		: fallback;
}

function readRollKind(
	value: unknown,
	fallback: CombatIntentRollKind
): CombatIntentRollKind {
	return ROLL_KIND_OPTIONS.some(option => option.value === value)
		? (value as CombatIntentRollKind)
		: fallback;
}

function readHitZoneKind(
	value: unknown,
	fallback: CombatIntentHitZoneKind
): CombatIntentHitZoneKind {
	return HIT_ZONE_KIND_OPTIONS.some(option => option.value === value)
		? (value as CombatIntentHitZoneKind)
		: fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function draftSignature(draft: CombatIntentDraft | null): string {
	return JSON.stringify(draft ?? null);
}

function compareCombatIntents(first: CombatIntent, second: CombatIntent) {
	const orderDiff = first.sortOrder - second.sortOrder;
	return orderDiff || first.name.localeCompare(second.name, 'ru');
}

function compareConditions(first: Condition, second: Condition) {
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
