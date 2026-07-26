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
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
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
	ANATOMY_SCHEMES_REPOSITORY,
	AnatomySchemesRepository
} from '../../../../anatomy-schemes/data/anatomy-schemes-repository.port';
import { AnatomyScheme } from '../../../../anatomy-schemes/domain/anatomy-schemes.models';
import {
	CREATURES_REPOSITORY,
	CreaturesRepository
} from '../../../../creatures/data/creatures-repository.port';
import { Creature } from '../../../../creatures/domain/creatures.models';
import {
	SKILLS_REPOSITORY,
	SkillsRepository
} from '../../../../skills/data/skills-repository.port';
import { Skill } from '../../../../skills/domain/skills.models';
import {
	WEAPONS_REPOSITORY,
	WeaponsRepository
} from '../../../../weapons/data/weapons-repository.port';
import { Weapon } from '../../../../weapons/domain/weapons.models';
import { CONDITIONS_REPOSITORY } from '../../../data/conditions-repository.port';
import {
	ConditionDurationType,
	ConditionEffectScope,
	ConditionEffectTargetScope,
	ConditionEffectType,
	ConditionApplicationCondition,
	ConditionApplicationConditionType,
	ConditionDuplicateInstanceMode,
	ConditionInstanceLimitMode,
	ConditionInstanceMode,
	ConditionInstanceOverflowMode,
	ConditionInstanceUniquenessMode,
	ConditionParameter,
	ConditionParameterType,
	ConditionParameterValueSource,
	ConditionRepeatDurationMode,
	ConditionRepeatLevelMode,
	ConditionRemovalMethod,
	ConditionRuleTemplateType,
	ConditionRuleTemplateValue,
	ConditionSizeRelativeMode,
	conditionApplicationConditionTypes,
	conditionDuplicateInstanceModes,
	conditionEffectTargetScopes,
	conditionInstanceLimitModes,
	conditionInstanceModes,
	conditionInstanceOverflowModes,
	conditionInstanceUniquenessModes,
	conditionParameterTypes,
	conditionParameterValueSources,
	conditionRuleTemplateTypes,
	conditionSizeRelativeModes,
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
	targetScope: ConditionEffectTargetScope;
	value: number | null;
	config: Record<string, unknown>;
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
	instanceMode: ConditionInstanceMode;
	instanceLimitMode: ConditionInstanceLimitMode;
	maxInstances: number;
	instanceOverflowMode: ConditionInstanceOverflowMode;
	instanceUniquenessMode: ConditionInstanceUniquenessMode;
	duplicateInstanceMode: ConditionDuplicateInstanceMode;
	maxLevel: number;
	removalMethods: ConditionRemovalMethod[];
	effects: ConditionEffectDraft[];
	applicationConditions: ConditionApplicationCondition[];
	parameters: ConditionParameter[];
	textBlocks: ConditionTextBlock[];
	isActive: boolean;
	sortOrder: number;
}

interface ConditionValidationWarning {
	message: string;
}

interface ConditionParameterView {
	parameter: ConditionParameter;
	index: number;
}

interface ConditionParameterPreset {
	key: string;
	label: string;
	description: string;
	parameter: Omit<ConditionParameter, 'sortOrder'>;
}

type EffectTiming =
	| 'owner_activation_start'
	| 'owner_activation_end'
	| 'round_start'
	| 'round_end';

type ConditionParameterValue =
	| string
	| number
	| boolean
	| ConditionRuleTemplateValue;

interface ConditionTextPreviewContext {
	ownerName?: string;
	currentLevel?: number;
	remainingDuration?: string;
}

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

const EFFECT_TARGET_SCOPE_LABELS: Record<ConditionEffectTargetScope, string> = {
	holder: 'К носителю состояния',
	source_against_holder: 'К источнику против носителя',
	source_group_against_holder: 'К группе источника против носителя',
	all_creatures_against_holder: 'Ко всем существам против носителя'
};

const EFFECT_TARGET_SCOPE_OPTIONS: SelectOption<ConditionEffectTargetScope>[] =
	conditionEffectTargetScopes.map(scope => ({
		label: EFFECT_TARGET_SCOPE_LABELS[scope],
		value: scope
	}));

const APPLICATION_CONDITION_TYPE_LABELS: Record<
	ConditionApplicationConditionType,
	string
> = {
	target_is_creature: 'Цель должна быть существом',
	target_has_anatomy: 'Цель должна иметь анатомию',
	target_missing_condition: 'Цель не должна иметь состояние',
	target_size_relative: 'Размер цели относительно источника',
	source_holds_target: 'Источник должен удерживать цель'
};

const APPLICATION_CONDITION_TYPE_OPTIONS: SelectOption<ConditionApplicationConditionType>[] =
	conditionApplicationConditionTypes.map(type => ({
		label: APPLICATION_CONDITION_TYPE_LABELS[type],
		value: type
	}));

const SIZE_RELATIVE_MODE_LABELS: Record<ConditionSizeRelativeMode, string> = {
	target_not_larger_than_source_by_more_than:
		'Цель не крупнее источника больше чем на',
	target_not_smaller_than_source_by_more_than:
		'Цель не меньше источника больше чем на'
};

const SIZE_RELATIVE_MODE_OPTIONS: SelectOption<ConditionSizeRelativeMode>[] =
	conditionSizeRelativeModes.map(mode => ({
		label: SIZE_RELATIVE_MODE_LABELS[mode],
		value: mode
	}));

const EFFECT_TIMING_OPTIONS: SelectOption<EffectTiming>[] = [
	{ label: 'В начале активации владельца', value: 'owner_activation_start' },
	{ label: 'В конце активации владельца', value: 'owner_activation_end' },
	{ label: 'В начале раунда', value: 'round_start' },
	{ label: 'В конце раунда', value: 'round_end' }
];

const TEXT_TOKEN_OPTIONS: SelectOption<ConditionTextToken>[] = [
	{ label: 'Название состояния', value: 'conditionName' },
	{ label: 'Владелец состояния', value: 'ownerName' },
	{ label: 'Описание', value: 'description' },
	{ label: 'Длительность', value: 'duration' },
	{ label: 'Текущий уровень', value: 'currentLevel' },
	{ label: 'Максимальный уровень', value: 'maxLevel' },
	{ label: 'Оставшаяся длительность', value: 'remainingDuration' },
	{ label: 'Способы снятия', value: 'removalMethods' },
	{ label: 'Эффекты', value: 'effects' },
	{ label: 'Источник состояния', value: 'source' },
	{ label: 'Цель связи', value: 'targetName' },
	{ label: 'Часть тела', value: 'bodyPart' },
	{ label: 'Удерживающая часть', value: 'holdingPart' },
	{ label: 'Максимальная дистанция', value: 'maxDistanceMeters' },
	{ label: 'Правило перемещения', value: 'movementRule' },
	{ label: 'Способ освобождения', value: 'escapeMode' },
	{ label: 'Стоимость освобождения', value: 'escapeCostPotential' },
	{ label: 'Сложность освобождения', value: 'escapeDifficulty' },
	{ label: 'Правило освобождения', value: 'escapeRule' }
];

const PARAMETER_TYPE_LABELS: Record<ConditionParameterType, string> = {
	text: 'Текст',
	number: 'Число',
	boolean: 'Да / нет',
	creature: 'Существо',
	combat_participant: 'Участник боя',
	body_part: 'Часть тела',
	item: 'Предмет',
	distance: 'Дистанция',
	check: 'Проверка',
	rule: 'Правило',
	rule_template: 'Шаблон правила'
};

const PARAMETER_TYPE_OPTIONS: SelectOption<ConditionParameterType>[] =
	conditionParameterTypes.map(type => ({
		label: PARAMETER_TYPE_LABELS[type],
		value: type
	}));

const INSTANCE_MODE_LABELS: Record<ConditionInstanceMode, string> = {
	single: 'Один общий экземпляр',
	separate_by_source: 'Отдельно на источник',
	multiple_independent: 'Несколько независимых'
};

const INSTANCE_MODE_OPTIONS: SelectOption<ConditionInstanceMode>[] =
	conditionInstanceModes.map(mode => ({
		label: INSTANCE_MODE_LABELS[mode],
		value: mode
	}));

const INSTANCE_LIMIT_MODE_LABELS: Record<ConditionInstanceLimitMode, string> = {
	none: 'Без лимита',
	fixed: 'Фиксированное число'
};

const INSTANCE_LIMIT_MODE_OPTIONS: SelectOption<ConditionInstanceLimitMode>[] =
	conditionInstanceLimitModes.map(mode => ({
		label: INSTANCE_LIMIT_MODE_LABELS[mode],
		value: mode
	}));

const INSTANCE_OVERFLOW_MODE_LABELS: Record<
	ConditionInstanceOverflowMode,
	string
> = {
	reject_new: 'Запретить новое наложение',
	replace_oldest: 'Заменить самый старый',
	replace_lowest_level: 'Заменить самый слабый',
	manual_choice: 'Выбрать вручную'
};

const INSTANCE_OVERFLOW_MODE_OPTIONS: SelectOption<ConditionInstanceOverflowMode>[] =
	conditionInstanceOverflowModes.map(mode => ({
		label: INSTANCE_OVERFLOW_MODE_LABELS[mode],
		value: mode
	}));

const INSTANCE_UNIQUENESS_MODE_LABELS: Record<
	ConditionInstanceUniquenessMode,
	string
> = {
	none: 'Не проверять',
	source: 'Источник',
	holding_part: 'Удерживающая часть или предмет',
	source_and_holding_part: 'Источник + удерживающая часть',
	item: 'Предмет',
	ability: 'Способность или атака'
};

const INSTANCE_UNIQUENESS_MODE_OPTIONS: SelectOption<ConditionInstanceUniquenessMode>[] =
	conditionInstanceUniquenessModes.map(mode => ({
		label: INSTANCE_UNIQUENESS_MODE_LABELS[mode],
		value: mode
	}));

const DUPLICATE_INSTANCE_MODE_LABELS: Record<
	ConditionDuplicateInstanceMode,
	string
> = {
	reject_duplicate: 'Запретить',
	update_existing: 'Обновить существующий',
	create_new: 'Создать новый'
};

const DUPLICATE_INSTANCE_MODE_OPTIONS: SelectOption<ConditionDuplicateInstanceMode>[] =
	conditionDuplicateInstanceModes.map(mode => ({
		label: DUPLICATE_INSTANCE_MODE_LABELS[mode],
		value: mode
	}));

const PARAMETER_VALUE_SOURCE_LABELS: Record<
	ConditionParameterValueSource,
	string
> = {
	manual: 'Вручную при наложении',
	target: 'Из цели',
	source: 'Из источника',
	attack: 'Из атаки',
	selected_body_zone: 'Из выбранной зоны тела',
	check_result: 'Из результата проверки'
};

const PARAMETER_VALUE_SOURCE_OPTIONS: SelectOption<ConditionParameterValueSource>[] =
	conditionParameterValueSources.map(source => ({
		label: PARAMETER_VALUE_SOURCE_LABELS[source],
		value: source
	}));

const COMBAT_PARTICIPANT_OPTIONS: SelectOption<string>[] = [
	{ label: 'Цель состояния', value: 'цель' },
	{ label: 'Источник состояния', value: 'источник состояния' },
	{ label: 'Атакующий', value: 'атакующий' },
	{ label: 'Защищающийся', value: 'защищающийся' }
];

const CONTEXT_ITEM_OPTIONS: SelectOption<string>[] = [
	{ label: 'Предмет источника', value: 'предмет источника' },
	{ label: 'Предмет цели', value: 'предмет цели' },
	{ label: 'Оружие атаки', value: 'оружие атаки' },
	{ label: 'Удерживающий предмет', value: 'удерживающий предмет' }
];

const RULE_TEMPLATE_TYPE_LABELS: Record<ConditionRuleTemplateType, string> = {
	opposed_check: 'Встречная проверка',
	fixed_difficulty: 'Фиксированная сложность',
	spend_potential: 'Потратить Потенциал',
	remove_source: 'Устранить источник'
};

const RULE_TEMPLATE_TYPE_OPTIONS: SelectOption<ConditionRuleTemplateType>[] =
	conditionRuleTemplateTypes.map(template => ({
		label: RULE_TEMPLATE_TYPE_LABELS[template],
		value: template
	}));

const CONDITION_PARAMETER_PRESETS: ConditionParameterPreset[] = [
	{
		key: 'target_name',
		label: 'Цель',
		description: 'Существо, на которое наложено состояние.',
		parameter: {
			key: 'target_name',
			label: 'Цель',
			type: 'combat_participant',
			valueSource: 'target',
			isRequired: true,
			defaultValue: 'цель'
		}
	},
	{
		key: 'source_name',
		label: 'Источник',
		description: 'Существо, предмет или эффект, который создал состояние.',
		parameter: {
			key: 'source_name',
			label: 'Источник состояния',
			type: 'combat_participant',
			valueSource: 'source',
			isRequired: true,
			defaultValue: 'источник состояния'
		}
	},
	{
		key: 'body_part',
		label: 'Зона тела',
		description: 'Анатомическая зона или подзона, выбранная при наложении.',
		parameter: {
			key: 'body_part',
			label: 'Зона тела',
			type: 'body_part',
			valueSource: 'selected_body_zone',
			isRequired: true,
			defaultValue: ''
		}
	},
	{
		key: 'max_distance',
		label: 'Дистанция',
		description: 'Дистанция связи, ограничения движения или действия эффекта.',
		parameter: {
			key: 'max_distance',
			label: 'Дистанция',
			type: 'distance',
			valueSource: 'attack',
			isRequired: true,
			defaultValue: 1
		}
	},
	{
		key: 'holding_part',
		label: 'Удерживающая часть',
		description:
			'Часть тела, предмет или эффект, которым выполняется удержание.',
		parameter: {
			key: 'holding_part',
			label: 'Удерживающая часть',
			type: 'text',
			valueSource: 'attack',
			isRequired: true,
			defaultValue: 'удерживающая часть или предмет'
		}
	},
	{
		key: 'escape_check',
		label: 'Проверка освобождения',
		description:
			'Название проверки, которая используется для снятия состояния.',
		parameter: {
			key: 'escape_check',
			label: 'Проверка освобождения',
			type: 'check',
			valueSource: 'attack',
			isRequired: true,
			defaultValue: 'проверка освобождения'
		}
	},
	{
		key: 'escape_rule',
		label: 'Правило освобождения',
		description:
			'Готовый шаблон для встречной проверки, фиксированной сложности, траты Потенциала или устранения источника.',
		parameter: {
			key: 'escape_rule',
			label: 'Правило освобождения',
			type: 'rule_template',
			valueSource: 'attack',
			isRequired: true,
			defaultValue: createRuleTemplateValue()
		}
	}
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
		Tab,
		TabList,
		TabPanel,
		TabPanels,
		Tabs,
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
	private readonly creaturesRepository =
		inject<CreaturesRepository>(CREATURES_REPOSITORY);
	private readonly anatomySchemesRepository = inject<AnatomySchemesRepository>(
		ANATOMY_SCHEMES_REPOSITORY
	);
	private readonly weaponsRepository =
		inject<WeaponsRepository>(WEAPONS_REPOSITORY);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly durationOptions = DURATION_OPTIONS;
	protected readonly repeatLevelOptions = REPEAT_LEVEL_OPTIONS;
	protected readonly repeatDurationOptions = REPEAT_DURATION_OPTIONS;
	protected readonly instanceModeOptions = INSTANCE_MODE_OPTIONS;
	protected readonly instanceLimitModeOptions = INSTANCE_LIMIT_MODE_OPTIONS;
	protected readonly instanceOverflowModeOptions =
		INSTANCE_OVERFLOW_MODE_OPTIONS;
	protected readonly instanceUniquenessModeOptions =
		INSTANCE_UNIQUENESS_MODE_OPTIONS;
	protected readonly duplicateInstanceModeOptions =
		DUPLICATE_INSTANCE_MODE_OPTIONS;
	protected readonly removalOptions = REMOVAL_OPTIONS;
	protected readonly effectTypeOptions = EFFECT_TYPE_OPTIONS;
	protected readonly effectScopeOptions = EFFECT_SCOPE_OPTIONS;
	protected readonly effectTargetScopeOptions = EFFECT_TARGET_SCOPE_OPTIONS;
	protected readonly applicationConditionTypeOptions =
		APPLICATION_CONDITION_TYPE_OPTIONS;
	protected readonly sizeRelativeModeOptions = SIZE_RELATIVE_MODE_OPTIONS;
	protected readonly effectTimingOptions = EFFECT_TIMING_OPTIONS;
	protected readonly parameterTypeOptions = PARAMETER_TYPE_OPTIONS;
	protected readonly parameterValueSourceOptions =
		PARAMETER_VALUE_SOURCE_OPTIONS;
	protected readonly ruleTemplateTypeOptions = RULE_TEMPLATE_TYPE_OPTIONS;
	protected readonly parameterPresets = CONDITION_PARAMETER_PRESETS;
	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Состояния' }
	];
	protected readonly selectedConditionId = signal<string | null>(null);
	protected readonly searchQuery = signal('');
	protected readonly conditions = signal<Condition[]>([]);
	protected readonly characteristics = signal<Characteristic[]>([]);
	protected readonly skills = signal<Skill[]>([]);
	protected readonly creatures = signal<Creature[]>([]);
	protected readonly anatomySchemes = signal<AnatomyScheme[]>([]);
	protected readonly weapons = signal<Weapon[]>([]);
	protected readonly draft = signal<ConditionDraft | null>(null);
	protected readonly previewParameterValues = signal<
		Record<string, ConditionParameterValue>
	>({});
	protected readonly previewOwnerName = signal('существо');
	protected readonly previewCurrentLevel = signal(1);
	protected readonly previewRemainingDuration = signal('');
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly importDialogVisible = signal(false);
	protected readonly parameterPresetDialogVisible = signal(false);
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
	protected readonly validationWarnings = computed(() => {
		const draft = this.draft();
		return draft ? validateConditionDraft(draft) : [];
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
	protected readonly textTokenOptionsForDraft = computed<
		SelectOption<ConditionTextToken>[]
	>(() => {
		const parameterOptions =
			this.draft()?.parameters.map(parameter => ({
				label: `Параметр: ${parameter.label}`,
				value: `parameter:${parameter.key}` as ConditionTextToken
			})) ?? [];

		return [...TEXT_TOKEN_OPTIONS, ...parameterOptions];
	});
	protected readonly conditionParameterViews = computed<
		ConditionParameterView[]
	>(() => this.parameterViewsByInstanceState(false));
	protected readonly instanceParameterViews = computed<
		ConditionParameterView[]
	>(() => this.parameterViewsByInstanceState(true));
	protected readonly parameterViews = computed<ConditionParameterView[]>(() => [
		...this.conditionParameterViews(),
		...this.instanceParameterViews()
	]);
	protected readonly conditionOptions = computed<SelectOption<string>[]>(() =>
		this.conditions()
			.filter(item => item.isActive)
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			})
			.map(item => ({ label: item.name, value: item.id }))
	);
	protected readonly creatureOptions = computed<SelectOption<string>[]>(() =>
		this.creatures()
			.filter(item => item.isActive)
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			})
			.map(item => ({ label: item.name, value: item.name }))
	);
	protected readonly bodyPartOptions = computed<SelectOption<string>[]>(() =>
		this.anatomySchemes()
			.filter(scheme => scheme.isActive)
			.flatMap(scheme =>
				scheme.zones
					.filter(zone => zone.isActive)
					.sort((first, second) => {
						const orderDiff = first.sortOrder - second.sortOrder;
						return orderDiff || first.name.localeCompare(second.name, 'ru');
					})
					.map(zone => ({
						label: `${scheme.name}: ${zone.name}`,
						value: zone.name
					}))
			)
			.sort((first, second) => first.label.localeCompare(second.label, 'ru'))
	);
	protected readonly itemOptions = computed<SelectOption<string>[]>(() => [
		...CONTEXT_ITEM_OPTIONS,
		...this.weapons()
			.filter(item => item.isActive)
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			})
			.map(item => ({ label: `Оружие: ${item.name}`, value: item.name }))
	]);

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
				this.resetPreviewParameterValues(draft);
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

	protected updateDraftInstanceMode(instanceMode: ConditionInstanceMode) {
		this.patchDraft({
			instanceMode,
			maxInstances:
				instanceMode === 'single' ? 1 : (this.draft()?.maxInstances ?? 1)
		});
	}

	protected updateDraftInstanceLimitMode(
		instanceLimitMode: ConditionInstanceLimitMode
	) {
		this.patchDraft({ instanceLimitMode });
	}

	protected updateDraftMaxInstances(maxInstances: number | null) {
		this.patchDraft({ maxInstances: Math.max(1, maxInstances ?? 1) });
	}

	protected updateDraftInstanceOverflowMode(
		instanceOverflowMode: ConditionInstanceOverflowMode
	) {
		this.patchDraft({ instanceOverflowMode });
	}

	protected updateDraftInstanceUniquenessMode(
		instanceUniquenessMode: ConditionInstanceUniquenessMode
	) {
		this.patchDraft({ instanceUniquenessMode });
	}

	protected updateDraftDuplicateInstanceMode(
		duplicateInstanceMode: ConditionDuplicateInstanceMode
	) {
		this.patchDraft({ duplicateInstanceMode });
	}

	protected repeatApplicationPreview() {
		const draft = this.draft();

		if (!draft) {
			return '';
		}

		return `Если состояние накладывается повторно: ${repeatLevelRuleText(draft.repeatLevelMode)} ${repeatDurationRuleText(draft.repeatDurationMode)}`;
	}

	protected instancePolicyPreview() {
		const draft = this.draft();

		if (!draft) {
			return '';
		}

		return instancePolicyText(draft);
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

	protected showParameterPresetDialog() {
		this.parameterPresetDialogVisible.set(true);
	}

	protected hideParameterPresetDialog() {
		this.parameterPresetDialogVisible.set(false);
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
		this.resetPreviewParameterValues(draft);
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
					targetScope: 'holder',
					value: 0,
					config: {},
					targetId: null,
					timing: 'owner_activation_start',
					ruleText: '',
					sortOrder: draft.effects.length
				}
			]
		});
	}

	protected addApplicationCondition() {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			applicationConditions: [
				...draft.applicationConditions,
				createApplicationCondition(draft.applicationConditions.length)
			]
		});
	}

	protected updateApplicationConditionType(
		index: number,
		type: ConditionApplicationConditionType
	) {
		this.patchApplicationCondition(index, condition => ({
			...condition,
			type,
			config: createApplicationConditionConfig(type, condition.config)
		}));
	}

	protected updateApplicationConditionActive(index: number, isActive: boolean) {
		this.patchApplicationCondition(index, condition => ({
			...condition,
			isActive
		}));
	}

	protected updateApplicationConditionTargetCondition(
		index: number,
		conditionId: string | null
	) {
		this.patchApplicationConditionConfig(index, {
			conditionId: conditionId ?? ''
		});
	}

	protected updateApplicationConditionSizeMode(
		index: number,
		sizeMode: ConditionSizeRelativeMode
	) {
		this.patchApplicationConditionConfig(index, { sizeMode });
	}

	protected updateApplicationConditionSizeDelta(
		index: number,
		sizeDelta: number | null
	) {
		this.patchApplicationConditionConfig(index, {
			sizeDelta: Math.max(0, sizeDelta ?? 0)
		});
	}

	protected removeApplicationCondition(index: number) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			applicationConditions: draft.applicationConditions
				.filter((_, currentIndex) => currentIndex !== index)
				.map((condition, sortOrder) => ({ ...condition, sortOrder }))
		});
	}

	protected applicationConditionText(condition: ConditionApplicationCondition) {
		return renderApplicationCondition(condition, this.conditions());
	}

	protected addParameter() {
		this.showParameterPresetDialog();
	}

	protected addEmptyParameter() {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		const index = draft.parameters.length;
		this.patchDraft({
			parameters: [
				...draft.parameters,
				{
					key: `parameter_${index + 1}`,
					label: 'Новый параметр',
					type: 'text',
					valueSource: 'manual',
					isRequired: true,
					sortOrder: index
				}
			]
		});
		this.hideParameterPresetDialog();
	}

	protected addParameterPreset(preset: ConditionParameterPreset) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		const index = draft.parameters.length;
		this.patchDraft({
			parameters: [
				...draft.parameters,
				{
					...preset.parameter,
					key: createUniqueParameterKey(preset.parameter.key, draft.parameters),
					defaultValue: coerceParameterValue(
						preset.parameter.type,
						preset.parameter.defaultValue
					),
					sortOrder: index
				}
			]
		});
		this.hideParameterPresetDialog();
	}

	protected updateParameterLabel(index: number, label: string) {
		this.patchParameter(index, { label });
	}

	protected updateParameterType(index: number, type: ConditionParameterType) {
		const parameter = this.draft()?.parameters[index];
		this.patchParameter(index, {
			type,
			defaultValue: coerceParameterValue(type, parameter?.defaultValue)
		});
	}

	protected updateParameterValueSource(
		index: number,
		valueSource: ConditionParameterValueSource
	) {
		this.patchParameter(index, { valueSource });
	}

	protected updateParameterRequired(index: number, isRequired: boolean) {
		this.patchParameter(index, { isRequired });
	}

	protected updateParameterDefaultValue(index: number, value: string) {
		this.patchParameter(index, { defaultValue: value });
	}

	protected updateParameterDefaultNumber(index: number, value: number | null) {
		this.patchParameter(index, { defaultValue: value ?? 0 });
	}

	protected updateParameterDefaultBoolean(index: number, value: boolean) {
		this.patchParameter(index, { defaultValue: value });
	}

	protected updateParameterDefaultRuleTemplate(
		index: number,
		patch: Partial<ConditionRuleTemplateValue>
	) {
		const parameter = this.draft()?.parameters[index];
		const current = parameter
			? this.parameterRuleTemplateValue(parameter)
			: createRuleTemplateValue();

		this.patchParameter(index, {
			defaultValue: normalizeRuleTemplateValue({ ...current, ...patch })
		});
	}

	protected parameterTextValue(parameter: ConditionParameter) {
		return typeof parameter.defaultValue === 'string'
			? parameter.defaultValue
			: parameter.defaultValue === undefined
				? ''
				: String(parameter.defaultValue);
	}

	protected parameterNumberValue(parameter: ConditionParameter) {
		return typeof parameter.defaultValue === 'number'
			? parameter.defaultValue
			: Number(parameter.defaultValue) || 0;
	}

	protected parameterBooleanValue(parameter: ConditionParameter) {
		return typeof parameter.defaultValue === 'boolean'
			? parameter.defaultValue
			: false;
	}

	protected parameterRuleTemplateValue(
		parameter: ConditionParameter
	): ConditionRuleTemplateValue {
		return readRuleTemplateValue(parameter.defaultValue);
	}

	protected ruleTemplatePreview(value: ConditionRuleTemplateValue) {
		return renderRuleTemplateValue(value);
	}

	protected isInstanceParameter(parameter: ConditionParameter) {
		return isInstanceParameter(parameter);
	}

	protected parameterStorageLabel(parameter: ConditionParameter) {
		return isInstanceParameter(parameter)
			? 'Заполняется при наложении'
			: 'Хранится в состоянии';
	}

	protected parameterPresetStorageLabel(preset: ConditionParameterPreset) {
		return preset.parameter.valueSource === 'manual'
			? 'Хранится в состоянии'
			: 'Заполняется при наложении';
	}

	protected isFirstConditionParameterView(view: ConditionParameterView) {
		return (
			!isInstanceParameter(view.parameter) &&
			this.conditionParameterViews()[0]?.index === view.index
		);
	}

	protected isFirstInstanceParameterView(view: ConditionParameterView) {
		return (
			isInstanceParameter(view.parameter) &&
			this.instanceParameterViews()[0]?.index === view.index
		);
	}

	protected parameterSelectOptions(type: ConditionParameterType) {
		switch (type) {
			case 'creature':
				return this.creatureOptions();
			case 'combat_participant':
				return COMBAT_PARTICIPANT_OPTIONS;
			case 'body_part':
				return this.bodyPartOptions();
			case 'item':
				return this.itemOptions();
			default:
				return [];
		}
	}

	protected updatePreviewParameterText(key: string, value: string) {
		this.patchPreviewParameter(key, value);
	}

	protected updatePreviewParameterNumber(key: string, value: number | null) {
		this.patchPreviewParameter(key, value ?? 0);
	}

	protected updatePreviewParameterBoolean(key: string, value: boolean) {
		this.patchPreviewParameter(key, value);
	}

	protected updatePreviewParameterRuleTemplate(
		key: string,
		parameter: ConditionParameter,
		patch: Partial<ConditionRuleTemplateValue>
	) {
		const current = this.previewParameterRuleTemplateValue(parameter);
		this.patchPreviewParameter(
			key,
			normalizeRuleTemplateValue({ ...current, ...patch })
		);
	}

	protected previewParameterTextValue(parameter: ConditionParameter) {
		const value = this.previewParameterValues()[parameter.key];

		if (typeof value === 'string') {
			return value;
		}

		if (value !== undefined) {
			return String(value);
		}

		return this.parameterTextValue(parameter);
	}

	protected previewParameterNumberValue(parameter: ConditionParameter) {
		const value = this.previewParameterValues()[parameter.key];

		if (typeof value === 'number') {
			return value;
		}

		if (typeof value === 'string') {
			return Number(value) || 0;
		}

		return this.parameterNumberValue(parameter);
	}

	protected previewParameterBooleanValue(parameter: ConditionParameter) {
		const value = this.previewParameterValues()[parameter.key];
		return typeof value === 'boolean'
			? value
			: this.parameterBooleanValue(parameter);
	}

	protected previewParameterRuleTemplateValue(
		parameter: ConditionParameter
	): ConditionRuleTemplateValue {
		return readRuleTemplateValue(
			this.previewParameterValues()[parameter.key] ?? parameter.defaultValue
		);
	}

	protected removeParameter(index: number) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			parameters: draft.parameters
				.filter((_, currentIndex) => currentIndex !== index)
				.map((parameter, sortOrder) => ({ ...parameter, sortOrder }))
		});
	}

	protected moveParameter(index: number, direction: -1 | 1) {
		const draft = this.draft();
		const nextIndex = index + direction;

		if (!draft || nextIndex < 0 || nextIndex >= draft.parameters.length) {
			return;
		}

		const parameters = [...draft.parameters];
		const current = parameters[index];
		parameters[index] = parameters[nextIndex];
		parameters[nextIndex] = current;

		this.patchDraft({
			parameters: parameters.map((parameter, sortOrder) => ({
				...parameter,
				sortOrder
			}))
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

	protected updateEffectTargetScope(
		index: number,
		targetScope: ConditionEffectTargetScope
	) {
		this.patchEffect(index, { targetScope });
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

	protected conditionInstanceTextPreview() {
		const draft = this.draft();

		if (!draft) {
			return '';
		}

		return renderConditionText(draft, this.previewParameterValues(), {
			ownerName: this.previewOwnerName(),
			currentLevel: this.previewCurrentLevel(),
			remainingDuration: this.previewRemainingDuration()
		});
	}

	protected updatePreviewOwnerName(ownerName: string) {
		this.previewOwnerName.set(ownerName);
	}

	protected updatePreviewCurrentLevel(currentLevel: number | null) {
		this.previewCurrentLevel.set(Math.max(1, currentLevel ?? 1));
	}

	protected updatePreviewRemainingDuration(remainingDuration: string) {
		this.previewRemainingDuration.set(remainingDuration);
	}

	protected conditionEffectsPreview() {
		const draft = this.draft();
		return draft ? renderConditionEffects(draft) : '';
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
		this.resetPreviewParameterValues(draft);
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
			instanceMode: draft.instanceMode,
			instanceLimitMode: draft.instanceLimitMode,
			maxInstances: draft.maxInstances,
			instanceOverflowMode: draft.instanceOverflowMode,
			instanceUniquenessMode: draft.instanceUniquenessMode,
			duplicateInstanceMode: draft.duplicateInstanceMode,
			maxLevel: draft.maxLevel,
			removalMethods: draft.removalMethods,
			effects: draft.effects.map(toConditionEffectCommand),
			applicationConditions: normalizeApplicationConditions(
				draft.applicationConditions
			),
			parameters: normalizeConditionParameters(draft.parameters),
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
			skills: this.skillsRepository.loadAdminCatalog(),
			creatures: this.creaturesRepository.loadCatalog(),
			anatomySchemes: this.anatomySchemesRepository.loadCatalog(),
			weapons: this.weaponsRepository.loadCatalog()
		})
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => {
					this.conditions.set(catalog.conditions.conditions);
					this.characteristics.set(catalog.attributes.characteristics);
					this.skills.set(catalog.skills.skills);
					this.creatures.set(catalog.creatures.creatures);
					this.anatomySchemes.set(catalog.anatomySchemes.anatomySchemes);
					this.weapons.set(catalog.weapons.weapons);
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
		this.resetPreviewParameterValues(draft);
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
			instanceMode: condition.instanceMode,
			instanceLimitMode: condition.instanceLimitMode,
			maxInstances: condition.maxInstances,
			instanceOverflowMode: condition.instanceOverflowMode,
			instanceUniquenessMode: condition.instanceUniquenessMode,
			duplicateInstanceMode: condition.duplicateInstanceMode,
			maxLevel: condition.maxLevel,
			removalMethods: condition.removalMethods,
			effects: condition.effects.map((effect, index) => ({
				type: effect.type,
				scope: effect.scope,
				targetScope: readEffectTargetScope(effect.config),
				value: effect.value ?? null,
				config: effect.config,
				targetId: readConfigString(effect.config, 'targetId') || null,
				timing: readEffectTiming(effect.config),
				ruleText: readConfigString(effect.config, 'text'),
				sortOrder: effect.sortOrder ?? index
			})),
			applicationConditions: normalizeApplicationConditions(
				condition.applicationConditions
			),
			parameters: normalizeConditionParameters(condition.parameters),
			textBlocks: normalizeConditionTextBlocks(condition.textBlocks),
			isActive: condition.isActive,
			sortOrder: condition.sortOrder
		};

		this.selectedConditionId.set(condition.id);
		this.draft.set(draft);
		this.resetPreviewParameterValues(draft);
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

	private patchApplicationCondition(
		index: number,
		update: (
			condition: ConditionApplicationCondition
		) => ConditionApplicationCondition
	) {
		this.draft.update(draft => {
			if (!draft) {
				return draft;
			}

			return {
				...draft,
				applicationConditions: draft.applicationConditions.map(
					(condition, currentIndex) =>
						currentIndex === index ? update(condition) : condition
				)
			};
		});
	}

	private patchApplicationConditionConfig(
		index: number,
		configPatch: ConditionApplicationCondition['config']
	) {
		this.patchApplicationCondition(index, condition => ({
			...condition,
			config: { ...condition.config, ...configPatch }
		}));
	}

	private patchParameter(index: number, patch: Partial<ConditionParameter>) {
		this.draft.update(draft => {
			if (!draft) {
				return draft;
			}

			return {
				...draft,
				parameters: draft.parameters.map((parameter, currentIndex) =>
					currentIndex === index ? { ...parameter, ...patch } : parameter
				)
			};
		});
	}

	private patchPreviewParameter(key: string, value: ConditionParameterValue) {
		this.previewParameterValues.update(values => ({ ...values, [key]: value }));
	}

	private resetPreviewParameterValues(draft: ConditionDraft) {
		this.previewParameterValues.set(
			Object.fromEntries(
				draft.parameters.map(parameter => [
					parameter.key,
					coerceParameterValue(parameter.type, parameter.defaultValue)
				])
			)
		);
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

	private parameterViewsByInstanceState(
		isInstance: boolean
	): ConditionParameterView[] {
		return (
			this.draft()
				?.parameters.map((parameter, index) => ({ parameter, index }))
				.filter(view => isInstanceParameter(view.parameter) === isInstance) ??
			[]
		);
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
		instanceMode: 'single',
		instanceLimitMode: 'fixed',
		maxInstances: 1,
		instanceOverflowMode: 'reject_new',
		instanceUniquenessMode: 'none',
		duplicateInstanceMode: 'update_existing',
		maxLevel: 1,
		removalMethods: ['automatic'],
		effects: [],
		applicationConditions: [],
		parameters: [],
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
		instanceMode: readOption(
			value,
			'instanceMode',
			INSTANCE_MODE_OPTIONS,
			'single'
		),
		instanceLimitMode: readOption(
			value,
			'instanceLimitMode',
			INSTANCE_LIMIT_MODE_OPTIONS,
			'fixed'
		),
		maxInstances: readPositiveNumber(value, 'maxInstances', 1),
		instanceOverflowMode: readOption(
			value,
			'instanceOverflowMode',
			INSTANCE_OVERFLOW_MODE_OPTIONS,
			'reject_new'
		),
		instanceUniquenessMode: readOption(
			value,
			'instanceUniquenessMode',
			INSTANCE_UNIQUENESS_MODE_OPTIONS,
			'none'
		),
		duplicateInstanceMode: readOption(
			value,
			'duplicateInstanceMode',
			DUPLICATE_INSTANCE_MODE_OPTIONS,
			'update_existing'
		),
		maxLevel: readPositiveNumber(value, 'maxLevel', 1),
		removalMethods: readOptionArray(value, 'removalMethods', REMOVAL_OPTIONS, [
			'automatic'
		]),
		effects: readImportedEffects(value),
		applicationConditions: readImportedApplicationConditions(value),
		parameters: readImportedParameters(value),
		textBlocks: readImportedTextBlocks(value),
		isActive: readOptionalBoolean(value, 'isActive') ?? true,
		sortOrder: readNonNegativeNumber(value, 'sortOrder', 0)
	};
}

function readImportedParameters(
	value: Record<string, unknown>
): ConditionParameter[] {
	const parameters = value['parameters'];

	if (!Array.isArray(parameters)) {
		return [];
	}

	return normalizeConditionParameters(
		parameters.flatMap((item, index) => {
			if (!isRecord(item)) {
				return [];
			}

			const key =
				normalizeParameterKey(readOptionalString(item, 'key') ?? '') ||
				`parameter_${index + 1}`;
			const label = readOptionalString(item, 'label')?.trim() ?? '';
			const type = readOption(item, 'type', PARAMETER_TYPE_OPTIONS, 'text');

			if (!key || !label) {
				return [];
			}

			return [
				{
					key,
					label,
					type,
					valueSource: readOption(
						item,
						'valueSource',
						PARAMETER_VALUE_SOURCE_OPTIONS,
						'manual'
					),
					isRequired: readOptionalBoolean(item, 'isRequired') ?? true,
					defaultValue: readParameterDefaultValue(item['defaultValue']),
					sortOrder: readNonNegativeNumber(item, 'sortOrder', index)
				}
			];
		})
	);
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

		const token = readImportedTextToken(item['token']);

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
				targetScope: readEffectTargetScope(config),
				value: readOptionalNumber(item, 'value'),
				config,
				targetId: readConfigString(config, 'targetId') || null,
				timing: readEffectTiming(config),
				ruleText: readConfigString(config, 'text'),
				sortOrder: readNonNegativeNumber(item, 'sortOrder', index)
			}
		];
	});
}

function readImportedApplicationConditions(
	value: Record<string, unknown>
): ConditionApplicationCondition[] {
	const conditions = value['applicationConditions'];

	if (!Array.isArray(conditions)) {
		return [];
	}

	return normalizeApplicationConditions(
		conditions.flatMap((item, index) => {
			if (!isRecord(item)) {
				return [];
			}

			const type = readOption(
				item,
				'type',
				APPLICATION_CONDITION_TYPE_OPTIONS,
				'target_is_creature'
			);

			return [
				{
					type,
					isActive: readOptionalBoolean(item, 'isActive') ?? true,
					config: createApplicationConditionConfig(
						type,
						isRecord(item['config']) ? item['config'] : {}
					),
					sortOrder: readNonNegativeNumber(item, 'sortOrder', index)
				}
			];
		})
	);
}

function readImportedTextToken(value: unknown): ConditionTextToken {
	if (typeof value !== 'string') {
		return 'effects';
	}

	if (TEXT_TOKEN_OPTIONS.some(option => option.value === value)) {
		return value as ConditionTextToken;
	}

	return /^parameter:[a-z][a-z0-9_]*$/.test(value)
		? (value as ConditionTextToken)
		: 'effects';
}

function toConditionEffectCommand(effect: ConditionEffectDraft) {
	const config: Record<string, unknown> = { ...effect.config };
	config['targetScope'] = effect.targetScope;

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

function readEffectTargetScope(
	config: Record<string, unknown>
): ConditionEffectTargetScope {
	return readOption(
		config,
		'targetScope',
		EFFECT_TARGET_SCOPE_OPTIONS,
		'holder'
	);
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
		instanceMode: 'single',
		instanceLimitMode: 'fixed',
		maxInstances: 1,
		instanceOverflowMode: 'reject_new',
		instanceUniquenessMode: 'none',
		duplicateInstanceMode: 'update_existing',
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
		applicationConditions: [
			{
				type: 'target_is_creature',
				isActive: true,
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

function normalizeConditionParameters(
	parameters: ConditionParameter[]
): ConditionParameter[] {
	return parameters
		.flatMap((parameter, index) => {
			const key = normalizeParameterKey(parameter.key);
			const label = parameter.label.trim();

			if (!key || !label) {
				return [];
			}

			return [
				{
					key,
					label,
					type: parameter.type,
					valueSource: parameter.valueSource ?? 'manual',
					isRequired: parameter.isRequired,
					defaultValue: coerceParameterValue(
						parameter.type,
						readParameterDefaultValue(parameter.defaultValue)
					),
					sortOrder: parameter.sortOrder ?? index
				}
			];
		})
		.map((parameter, sortOrder) => ({ ...parameter, sortOrder }));
}

function normalizeApplicationConditions(
	conditions: ConditionApplicationCondition[]
): ConditionApplicationCondition[] {
	return conditions
		.flatMap((condition, index) => {
			if (
				!APPLICATION_CONDITION_TYPE_OPTIONS.some(
					option => option.value === condition.type
				)
			) {
				return [];
			}

			return [
				{
					type: condition.type,
					isActive: condition.isActive,
					config: createApplicationConditionConfig(
						condition.type,
						condition.config
					),
					sortOrder: condition.sortOrder ?? index
				}
			];
		})
		.map((condition, sortOrder) => ({ ...condition, sortOrder }));
}

function createApplicationCondition(
	sortOrder: number
): ConditionApplicationCondition {
	return {
		type: 'target_is_creature',
		isActive: true,
		config: {},
		sortOrder
	};
}

function createApplicationConditionConfig(
	type: ConditionApplicationConditionType,
	config: Record<string, unknown> = {}
): ConditionApplicationCondition['config'] {
	if (type === 'target_missing_condition') {
		return {
			conditionId:
				typeof config['conditionId'] === 'string' ? config['conditionId'] : ''
		};
	}

	if (type === 'target_size_relative') {
		return {
			sizeMode: readSizeRelativeMode(config['sizeMode']),
			sizeDelta:
				typeof config['sizeDelta'] === 'number'
					? Math.max(0, Math.trunc(config['sizeDelta']))
					: 1
		};
	}

	return {};
}

function readSizeRelativeMode(value: unknown): ConditionSizeRelativeMode {
	return typeof value === 'string' &&
		SIZE_RELATIVE_MODE_OPTIONS.some(option => option.value === value)
		? (value as ConditionSizeRelativeMode)
		: 'target_not_larger_than_source_by_more_than';
}

function repeatLevelRuleText(mode: ConditionRepeatLevelMode) {
	switch (mode) {
		case 'keep_current':
			return 'текущий уровень не меняется.';
		case 'replace_new':
			return 'текущий уровень заменяется новым.';
		case 'add':
			return 'текущий и новый уровни складываются, но не выше максимального уровня.';
		case 'keep_highest':
			return 'сохраняется больший уровень из текущего и нового.';
	}
}

function repeatDurationRuleText(mode: ConditionRepeatDurationMode) {
	switch (mode) {
		case 'keep_current':
			return 'Текущая длительность не меняется.';
		case 'replace_new':
			return 'Текущая длительность заменяется новой.';
		case 'add':
			return 'Текущая и новая длительности складываются.';
		case 'keep_highest':
			return 'Сохраняется большая длительность из текущей и новой.';
	}
}

function instancePolicyText(draft: ConditionDraft) {
	const limitText =
		draft.instanceLimitMode === 'none'
			? 'Глобального лимита экземпляров нет.'
			: `Максимум активных экземпляров: ${draft.maxInstances}. При превышении лимита: ${INSTANCE_OVERFLOW_MODE_LABELS[draft.instanceOverflowMode].toLowerCase()}.`;
	const uniquenessText =
		draft.instanceUniquenessMode === 'none'
			? 'Идентичность экземпляров не проверяется.'
			: `Уникальность экземпляра: ${INSTANCE_UNIQUENESS_MODE_LABELS[draft.instanceUniquenessMode].toLowerCase()}. Повтор идентичного экземпляра: ${DUPLICATE_INSTANCE_MODE_LABELS[draft.duplicateInstanceMode].toLowerCase()}.`;

	switch (draft.instanceMode) {
		case 'single':
			return 'Состояние хранится как один общий экземпляр. Повторное наложение обновляет его по правилам уровня и длительности.';
		case 'separate_by_source':
			return `Для каждого источника хранится отдельный экземпляр. Повтор от того же источника обновляет его по правилам уровня и длительности. ${limitText} ${uniquenessText}`;
		case 'multiple_independent':
			return `Каждое наложение создаёт отдельный экземпляр. Снятие прекращает выбранный экземпляр, остальные продолжают действовать. ${limitText} ${uniquenessText}`;
	}
}

function isInstanceParameter(parameter: ConditionParameter) {
	return parameter.valueSource !== 'manual';
}

function validateConditionDraft(
	draft: ConditionDraft
): ConditionValidationWarning[] {
	const warnings: ConditionValidationWarning[] = [];
	const parametersByKey = new Map(
		draft.parameters.map(parameter => [parameter.key, parameter])
	);
	const usedParameterKeys = new Set<string>();

	if (draft.instanceLimitMode === 'fixed' && draft.maxInstances < 1) {
		warnings.push({
			message: 'Максимум активных экземпляров должен быть не меньше 1.'
		});
	}

	for (const block of draft.textBlocks) {
		if (block.kind !== 'token' || !block.token.startsWith('parameter:')) {
			continue;
		}

		const key = block.token.slice('parameter:'.length);
		usedParameterKeys.add(key);

		if (!parametersByKey.has(key)) {
			warnings.push({
				message: `В тексте используется параметр «${key}», но такого параметра нет.`
			});
		}
	}

	for (const parameter of draft.parameters) {
		if (!usedParameterKeys.has(parameter.key)) {
			warnings.push({
				message: `Параметр «${parameter.label}» создан, но не используется в тексте.`
			});
		}

		if (parameter.isRequired && !hasParameterDefaultValue(parameter)) {
			warnings.push({
				message: `Обязательный параметр «${parameter.label}» не имеет значения по умолчанию.`
			});
		}
	}

	draft.effects.forEach((effect, index) => {
		const label = `Эффект ${index + 1}`;

		if (
			(effect.scope === 'characteristic' || effect.scope === 'skill') &&
			!effect.targetId
		) {
			warnings.push({
				message: `${label}: выбрана область «${optionLabel(EFFECT_SCOPE_OPTIONS, effect.scope)}», но цель эффекта не заполнена.`
			});
		}

		if (effectRequiresNumericValue(effect.type) && effect.value === null) {
			warnings.push({
				message: `${label}: для типа «${effectTypeText(effect.type)}» нужно заполнить значение.`
			});
		}

		if (effect.type === 'special_rule' && !effect.ruleText.trim()) {
			warnings.push({
				message: `${label}: для текстового особого правила нужно заполнить текст.`
			});
		}
	});

	draft.applicationConditions.forEach((condition, index) => {
		if (
			condition.type === 'target_missing_condition' &&
			!condition.config.conditionId
		) {
			warnings.push({
				message: `Условие применения ${index + 1}: нужно выбрать состояние, которого не должно быть у цели.`
			});
		}
	});

	return warnings;
}

function hasParameterDefaultValue(parameter: ConditionParameter) {
	const value = parameter.defaultValue;

	if (value === undefined || value === null) {
		return false;
	}

	return typeof value === 'string' ? Boolean(value.trim()) : true;
}

function effectRequiresNumericValue(type: ConditionEffectType) {
	return (
		type === 'dice_pool_modifier' ||
		type === 'potential_cost_modifier' ||
		type === 'periodic_damage' ||
		type === 'speed_modifier' ||
		type === 'defense_modifier' ||
		type === 'incoming_damage_modifier'
	);
}

function effectTypeText(type: ConditionEffectType) {
	return optionLabel(EFFECT_TYPE_OPTIONS, type);
}

function renderConditionText(
	draft: ConditionDraft,
	parameterValues: Record<string, ConditionParameterValue> = {},
	context: ConditionTextPreviewContext = {}
): string {
	const text = draft.textBlocks
		.filter(block => block.isActive)
		.sort((first, second) => first.sortOrder - second.sortOrder)
		.map(block =>
			block.kind === 'text'
				? block.text
				: renderConditionTextToken(draft, block.token, parameterValues, context)
		)
		.join('')
		.replace(/[ \t]+/g, ' ')
		.replace(/ *\n */g, '\n')
		.trim();

	return text || 'Текст для игрока пока не настроен.';
}

function renderConditionTextToken(
	draft: ConditionDraft,
	token: ConditionTextToken,
	parameterValues: Record<string, ConditionParameterValue>,
	context: ConditionTextPreviewContext
): string {
	if (token.startsWith('parameter:')) {
		const key = token.slice('parameter:'.length);
		const parameter = draft.parameters.find(item => item.key === key);
		const value = parameterValues[key] ?? parameter?.defaultValue;

		if (value !== undefined && value !== '') {
			return parameter ? formatParameterValue(parameter, value) : String(value);
		}

		return parameter ? `{${parameter.label}}` : `{${key}}`;
	}

	switch (token) {
		case 'conditionName':
			return draft.name || 'Состояние';
		case 'ownerName':
			return context.ownerName?.trim() || '{существо}';
		case 'description':
			return draft.description || 'Описание не заполнено.';
		case 'duration':
			return optionLabel(DURATION_OPTIONS, draft.durationType);
		case 'currentLevel':
			return String(context.currentLevel ?? '{уровень}');
		case 'maxLevel':
			return String(draft.maxLevel);
		case 'remainingDuration':
			return context.remainingDuration?.trim() || '{оставшаяся длительность}';
		case 'removalMethods':
			return draft.removalMethods
				.map(method => optionLabel(REMOVAL_OPTIONS, method))
				.join(', ');
		case 'effects':
			return renderConditionEffects(draft);
		case 'source':
			return '{источник состояния}';
		case 'targetName':
			return '{цель связи}';
		case 'bodyPart':
			return '{часть тела}';
		case 'holdingPart':
			return '{удерживающая часть}';
		case 'maxDistanceMeters':
			return '{максимальная дистанция}';
		case 'movementRule':
			return '{правило перемещения}';
		case 'escapeMode':
			return '{способ освобождения}';
		case 'escapeCostPotential':
			return '{стоимость освобождения}';
		case 'escapeDifficulty':
			return '{сложность освобождения}';
		case 'escapeRule':
			return '{правило освобождения}';
	}

	return '';
}

function normalizeParameterKey(value: string) {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9_]+/g, '_')
		.replace(/^_+|_+$/g, '');
}

function createUniqueParameterKey(
	baseKey: string,
	parameters: ConditionParameter[]
) {
	const normalizedBaseKey = normalizeParameterKey(baseKey) || 'parameter';
	const usedKeys = new Set(parameters.map(parameter => parameter.key));

	if (!usedKeys.has(normalizedBaseKey)) {
		return normalizedBaseKey;
	}

	let index = 2;
	let key = `${normalizedBaseKey}_${index}`;

	while (usedKeys.has(key)) {
		index += 1;
		key = `${normalizedBaseKey}_${index}`;
	}

	return key;
}

function readParameterDefaultValue(
	value: unknown
): ConditionParameterValue | undefined {
	return typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean' ||
		isRuleTemplateValue(value)
		? value
		: undefined;
}

function coerceParameterValue(
	type: ConditionParameterType,
	value: ConditionParameterValue | undefined
): ConditionParameterValue {
	if (type === 'number' || type === 'distance') {
		return typeof value === 'number' ? value : Number(value) || 0;
	}

	if (type === 'boolean') {
		return typeof value === 'boolean' ? value : false;
	}

	if (type === 'rule_template') {
		return readRuleTemplateValue(value);
	}

	return typeof value === 'string'
		? value
		: value === undefined
			? ''
			: String(value);
}

function formatParameterValue(
	parameter: ConditionParameter,
	value: ConditionParameterValue
) {
	if (parameter.type === 'distance') {
		const meters = typeof value === 'number' ? value : Number(value) || 0;
		return `${meters} м`;
	}

	if (parameter.type === 'boolean') {
		return value ? 'да' : 'нет';
	}

	if (parameter.type === 'rule_template') {
		return renderRuleTemplateValue(readRuleTemplateValue(value));
	}

	return String(value);
}

function createRuleTemplateValue(): ConditionRuleTemplateValue {
	return {
		template: 'opposed_check',
		checkName: 'проверка освобождения',
		potentialCost: 1,
		difficulty: 1
	};
}

function isRuleTemplateValue(
	value: unknown
): value is ConditionRuleTemplateValue {
	if (!isRecord(value)) {
		return false;
	}

	const template = value['template'];
	return (
		template === 'opposed_check' ||
		template === 'fixed_difficulty' ||
		template === 'spend_potential' ||
		template === 'remove_source'
	);
}

function readRuleTemplateValue(
	value: ConditionParameterValue | undefined
): ConditionRuleTemplateValue {
	return isRuleTemplateValue(value)
		? normalizeRuleTemplateValue(value)
		: createRuleTemplateValue();
}

function normalizeRuleTemplateValue(
	value: ConditionRuleTemplateValue
): ConditionRuleTemplateValue {
	return {
		template: value.template,
		checkName: value.checkName?.trim() || 'проверка освобождения',
		potentialCost: Math.max(0, Math.trunc(value.potentialCost ?? 0)),
		difficulty: Math.max(0, Math.trunc(value.difficulty ?? 0))
	};
}

function renderRuleTemplateValue(value: ConditionRuleTemplateValue): string {
	const rule = normalizeRuleTemplateValue(value);
	const costText = rule.potentialCost
		? `потратить ${rule.potentialCost} ${pluralizeRu(rule.potentialCost, 'Потенциал', 'Потенциала', 'Потенциала')} и `
		: '';
	const checkName = rule.checkName || 'проверку';

	switch (rule.template) {
		case 'opposed_check':
			return `Чтобы освободиться, нужно ${costText}выиграть встречную проверку: ${checkName}.`;
		case 'fixed_difficulty':
			return `Чтобы освободиться, нужно ${costText}пройти проверку: ${checkName}. Сложность: ${rule.difficulty}.`;
		case 'spend_potential':
			return rule.potentialCost
				? `Чтобы снять состояние, нужно потратить ${rule.potentialCost} ${pluralizeRu(rule.potentialCost, 'Потенциал', 'Потенциала', 'Потенциала')}.`
				: 'Чтобы снять состояние, нужно потратить Потенциал.';
		case 'remove_source':
			return 'Состояние снимается, когда источник устранён.';
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
	const targetScope = effectTargetScopeText(effect.targetScope);
	const value = effect.value ?? 0;

	switch (effect.type) {
		case 'dice_pool_modifier':
			return `${targetScope}: ${modifierText(value, 'кубик', 'кубика', 'кубиков')} ${scope}.`;
		case 'potential_cost_modifier':
			return `${targetScope}: ${modifierText(value, 'Потенциал', 'Потенциала', 'Потенциала')} к стоимости действий ${scope}.`;
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

function renderApplicationCondition(
	condition: ConditionApplicationCondition,
	conditions: Condition[]
): string {
	switch (condition.type) {
		case 'target_is_creature':
			return 'Цель должна быть существом.';
		case 'target_has_anatomy':
			return 'Цель должна иметь анатомическую схему.';
		case 'target_missing_condition': {
			const name = condition.config.conditionId
				? conditions.find(item => item.id === condition.config.conditionId)
						?.name
				: '';

			return name
				? `Нельзя применить, если цель уже имеет состояние «${name}».`
				: 'Нельзя применить, если цель уже имеет выбранное состояние.';
		}
		case 'target_size_relative': {
			const delta = condition.config.sizeDelta ?? 1;
			const mode =
				condition.config.sizeMode ??
				'target_not_larger_than_source_by_more_than';

			return mode === 'target_not_smaller_than_source_by_more_than'
				? `Цель не должна быть меньше источника больше чем на ${delta} ${pluralizeRu(delta, 'размер', 'размера', 'размеров')}.`
				: `Цель не должна быть крупнее источника больше чем на ${delta} ${pluralizeRu(delta, 'размер', 'размера', 'размеров')}.`;
		}
		case 'source_holds_target':
			return 'Источник должен удерживать цель.';
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

function effectTargetScopeText(scope: ConditionEffectTargetScope): string {
	switch (scope) {
		case 'holder':
			return 'Носитель состояния';
		case 'source_against_holder':
			return 'Источник против носителя';
		case 'source_group_against_holder':
			return 'Группа источника против носителя';
		case 'all_creatures_against_holder':
			return 'Все существа против носителя';
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
