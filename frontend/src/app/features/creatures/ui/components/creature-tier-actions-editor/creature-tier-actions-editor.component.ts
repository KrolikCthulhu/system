import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
	model,
	signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { NavigationTreeComponent } from '../../../../../shared/ui/navigation-tree/navigation-tree.component';
import {
	NavigationTreeGroup,
	NavigationTreeItem,
	NavigationTreeSubgroup
} from '../../../../../shared/ui/navigation-tree/navigation-tree.models';
import {
	CreatureAttackAvailabilityComparisonOperand,
	CreatureAttackAvailabilityComparisonOperator,
	CreatureAttackAvailabilityRule,
	CreatureCharacteristicOption,
	CreatureCombatIntentOption,
	CreatureConditionOption,
	CreatureDamageTypeOption,
	CreatureNaturalAttackOption,
	CreatureParrySkillGroup,
	CreatureSkillOption,
	CreatureTierAction,
	CreatureTierActionCost,
	CreatureTierActionDefense,
	CreatureTierActionEffect,
	CreatureTierActionKind,
	CreatureTierActionReference,
	CreatureTierActionRoll,
	CreatureTierActionSource,
	CreatureTierActionTarget
} from '../../../domain/creatures.models';

interface SelectOption<TValue extends string> {
	label: string;
	value: TValue;
}

interface ActionViewItem {
	action: CreatureTierAction;
	index: number;
	kindLabel: string;
	costText: string;
	sourceText: string;
}

interface ActionTextBlock {
	kind: 'text' | 'token';
	value: string;
}

const TEXT_BLOCK_KIND_OPTIONS: SelectOption<ActionTextBlock['kind']>[] = [
	{ label: 'Текст', value: 'text' },
	{ label: 'Подстановка', value: 'token' }
];

const KIND_OPTIONS: SelectOption<CreatureTierActionKind>[] = [
	{ label: 'Атака', value: 'attack' },
	{ label: 'Действие состояния', value: 'condition_action' },
	{ label: 'Активная способность', value: 'active_ability' },
	{ label: 'Реакция', value: 'reaction' },
	{ label: 'Пассивное правило', value: 'passive' }
];

const SOURCE_TYPE_OPTIONS: SelectOption<CreatureTierActionSource['type']>[] = [
	{ label: 'Естественная атака', value: 'natural_attack' },
	{ label: 'Оружие', value: 'weapon' },
	{ label: 'Состояние', value: 'condition' },
	{ label: 'Способность', value: 'ability' },
	{ label: 'Другое', value: 'custom' }
];

const COST_MODE_OPTIONS: SelectOption<CreatureTierActionCost['mode']>[] = [
	{ label: 'Бесплатно', value: 'free' },
	{ label: 'Фиксированная', value: 'fixed' },
	{ label: 'За метр', value: 'per_meter' },
	{ label: 'По правилу', value: 'rule' }
];

const TARGET_TYPE_OPTIONS: SelectOption<CreatureTierActionTarget['type']>[] = [
	{ label: 'Нет цели', value: 'none' },
	{ label: 'На себя', value: 'self' },
	{ label: 'Существо', value: 'creature' },
	{ label: 'Враждебное существо', value: 'hostile_creature' },
	{
		label: 'Цель по связанной паре состояний',
		value: 'linked_condition_target'
	},
	{ label: 'Отмеченная цель', value: 'marked_target' }
];

const VISIBILITY_OPTIONS: SelectOption<
	CreatureTierActionTarget['visibility']
>[] = [
	{ label: 'Любая', value: 'any' },
	{ label: 'Видимая', value: 'visible' }
];

const ROLL_TYPE_OPTIONS: SelectOption<CreatureTierActionRoll['type']>[] = [
	{ label: 'Без броска', value: 'none' },
	{ label: 'Профиль атаки', value: 'attack_profile' },
	{ label: 'Проверка', value: 'check' }
];

const DEFENSE_TYPE_OPTIONS: SelectOption<CreatureTierActionDefense['type']>[] =
	[
		{ label: 'Без защиты', value: 'none' },
		{ label: 'Физическая защита цели', value: 'target_physical_defense' }
	];

const PARRY_SKILL_GROUP_OPTIONS: SelectOption<CreatureParrySkillGroup>[] = [
	{ label: 'Рукопашный бой', value: 'unarmed' },
	{ label: 'Оружие ближнего боя', value: 'melee_weapon' },
	{ label: 'Щит', value: 'shield' }
];

const EFFECT_TYPE_OPTIONS: SelectOption<CreatureTierActionEffect['type']>[] = [
	{ label: 'Нанести урон', value: 'damage' },
	{ label: 'Наложить состояние', value: 'apply_condition' },
	{ label: 'Снять состояние', value: 'remove_condition' },
	{ label: 'Связать состояния', value: 'link_condition' },
	{ label: 'Разорвать связь состояний', value: 'unlink_condition' },
	{ label: 'Переместить связанную цель', value: 'move_linked_target' },
	{ label: 'Изменить пул кубиков', value: 'dice_pool_modifier' },
	{ label: 'Особое текстовое правило', value: 'special_rule' }
];

const DAMAGE_MODE_OPTIONS: SelectOption<
	NonNullable<CreatureTierActionEffect['damageMode']>
>[] = [
	{ label: 'Чистые успехи', value: 'clean_successes' },
	{ label: 'Чистые успехи + базовый урон', value: 'clean_successes_plus_base' },
	{ label: 'Базовый урон', value: 'base_damage' }
];

const EFFECT_SCOPE_OPTIONS: SelectOption<
	NonNullable<CreatureTierActionEffect['targetScope']>
>[] = [
	{ label: 'Исполнитель', value: 'actor' },
	{ label: 'Выбранная цель', value: 'selected_target' },
	{
		label: 'Цель по связанной паре состояний',
		value: 'linked_condition_target'
	},
	{ label: 'Носитель', value: 'holder' },
	{ label: 'Источник против носителя', value: 'source_against_holder' },
	{
		label: 'Группа источника против носителя',
		value: 'source_group_against_holder'
	},
	{
		label: 'Все существа против носителя',
		value: 'all_creatures_against_holder'
	}
];

const RULE_TYPE_OPTIONS: SelectOption<
	CreatureAttackAvailabilityRule['type']
>[] = [
	{ label: 'Ресурс свободен', value: 'resource_free' },
	{ label: 'Активное состояние', value: 'active_condition' },
	{ label: 'Сравнение', value: 'comparison' },
	{ label: 'Текстовое условие', value: 'special_rule' }
];

type ComparisonOperandValue = 'actor.sizeRank' | 'target.sizeRank' | 'constant';

const COMPARISON_OPERAND_OPTIONS: SelectOption<ComparisonOperandValue>[] = [
	{ label: 'Существо: размер', value: 'actor.sizeRank' },
	{ label: 'Цель: размер', value: 'target.sizeRank' },
	{ label: 'Число', value: 'constant' }
];

const COMPARISON_OPERATOR_OPTIONS: SelectOption<CreatureAttackAvailabilityComparisonOperator>[] =
	[
		{ label: 'Больше', value: 'gt' },
		{ label: 'Больше или равно', value: 'gte' },
		{ label: 'Равно', value: 'eq' },
		{ label: 'Не равно', value: 'ne' },
		{ label: 'Меньше или равно', value: 'lte' },
		{ label: 'Меньше', value: 'lt' }
	];

const TOKEN_OPTIONS = [
	{ label: 'Существо', value: '{существо}' },
	{ label: 'Название', value: '{название действия}' },
	{ label: 'Стоимость', value: '{стоимость}' },
	{ label: 'Цель', value: '{цель}' },
	{ label: 'Источник', value: '{источник}' },
	{ label: 'Бросок', value: '{бросок}' },
	{ label: 'Защита', value: '{защита}' },
	{ label: 'Все эффекты', value: '{эффекты}' }
];
const TOKEN_VALUES = new Set(TOKEN_OPTIONS.map(option => option.value));
const TOKEN_PATTERN = /(\{[^}]+\})/g;

@Component({
	selector: 'app-creature-tier-actions-editor',
	standalone: true,
	imports: [
		FormsModule,
		Button,
		InputNumber,
		InputText,
		MultiSelect,
		Select,
		Tab,
		TabList,
		TabPanel,
		TabPanels,
		Tabs,
		Tag,
		Textarea,
		ToggleSwitch,
		NavigationTreeComponent
	],
	templateUrl: './creature-tier-actions-editor.component.html',
	styleUrl: './creature-tier-actions-editor.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreatureTierActionsEditorComponent {
	readonly actions = model<CreatureTierAction[]>([]);
	readonly naturalAttacks = input<CreatureNaturalAttackOption[]>([]);
	readonly combatIntents = input<CreatureCombatIntentOption[]>([]);
	readonly damageTypes = input<CreatureDamageTypeOption[]>([]);
	readonly conditions = input<CreatureConditionOption[]>([]);
	readonly skills = input<CreatureSkillOption[]>([]);
	readonly characteristics = input<CreatureCharacteristicOption[]>([]);
	readonly actorName = input('Существо');

	protected readonly kindOptions = KIND_OPTIONS;
	protected readonly sourceTypeOptions = SOURCE_TYPE_OPTIONS;
	protected readonly costModeOptions = COST_MODE_OPTIONS;
	protected readonly targetTypeOptions = TARGET_TYPE_OPTIONS;
	protected readonly visibilityOptions = VISIBILITY_OPTIONS;
	protected readonly rollTypeOptions = ROLL_TYPE_OPTIONS;
	protected readonly defenseTypeOptions = DEFENSE_TYPE_OPTIONS;
	protected readonly parrySkillGroupOptions = PARRY_SKILL_GROUP_OPTIONS;
	protected readonly effectTypeOptions = EFFECT_TYPE_OPTIONS;
	protected readonly damageModeOptions = DAMAGE_MODE_OPTIONS;
	protected readonly effectScopeOptions = EFFECT_SCOPE_OPTIONS;
	protected readonly ruleTypeOptions = RULE_TYPE_OPTIONS;
	protected readonly comparisonOperandOptions = COMPARISON_OPERAND_OPTIONS;
	protected readonly comparisonOperatorOptions = COMPARISON_OPERATOR_OPTIONS;
	protected readonly tokenOptions = TOKEN_OPTIONS;
	protected readonly textBlockKindOptions = TEXT_BLOCK_KIND_OPTIONS;
	protected readonly selectedActionSlug = signal<string | null>(null);
	protected readonly collapsedActionGroups = signal<ReadonlySet<string>>(
		new Set()
	);
	protected readonly collapsedActionSubgroups = signal<ReadonlySet<string>>(
		new Set()
	);
	protected readonly actionItems = computed<ActionViewItem[]>(() => {
		return this.actions()
			.map((action, index) => ({
				action,
				index,
				kindLabel: this.kindLabel(action.kind),
				costText: this.costText(action),
				sourceText: this.sourceText(action)
			}))
			.sort(
				(first, second) => first.action.sortOrder - second.action.sortOrder
			);
	});
	protected readonly actionTreeGroups = computed<NavigationTreeGroup[]>(() =>
		this.createActionTreeGroups(this.actionItems())
	);
	protected readonly selectedActionItem = computed<ActionViewItem | null>(
		() => {
			const items = this.actionItems();
			const selectedSlug = this.selectedActionSlug();
			return (
				items.find(item => item.action.slug === selectedSlug) ??
				items[0] ??
				null
			);
		}
	);
	protected readonly selectedActionPreview = computed(() => {
		const item = this.selectedActionItem();
		return item ? this.renderText(item.action) : '';
	});

	protected addAction() {
		const action = this.createAction(this.actions().length);
		this.actions.update(actions => [...actions, action]);
		this.selectedActionSlug.set(action.slug);
	}

	protected removeAction(index: number) {
		const removedAction = this.actions()[index] ?? null;
		const nextActions = this.actions()
			.filter((_, actionIndex) => actionIndex !== index)
			.map((action, actionIndex) => ({ ...action, sortOrder: actionIndex }));
		this.actions.set(nextActions);
		if (removedAction?.slug === this.selectedActionSlug()) {
			this.selectedActionSlug.set(
				nextActions[Math.min(index, nextActions.length - 1)]?.slug ?? null
			);
		}
	}

	protected selectAction(slug: string) {
		this.selectedActionSlug.set(slug);
	}

	protected toggleActionGroup(label: string) {
		this.collapsedActionGroups.update(groups =>
			this.toggleSetValue(groups, label)
		);
	}

	protected toggleActionSubgroup(event: {
		groupLabel: string;
		subgroupLabel: string;
	}) {
		this.collapsedActionSubgroups.update(subgroups =>
			this.toggleSetValue(
				subgroups,
				`${event.groupLabel}::${event.subgroupLabel}`
			)
		);
	}

	protected updateAction(index: number, patch: Partial<CreatureTierAction>) {
		this.actions.update(actions =>
			actions.map((action, actionIndex) =>
				actionIndex === index ? { ...action, ...patch } : action
			)
		);
	}

	protected updateSource(
		index: number,
		patch: Partial<CreatureTierActionSource>
	) {
		const action = this.actionAt(index);
		const source = action?.source ?? this.defaultSource();
		this.updateAction(index, { source: { ...source, ...patch } });
	}

	protected updateSourceType(
		index: number,
		type: CreatureTierActionSource['type']
	) {
		this.updateAction(index, { source: { ...this.defaultSource(), type } });
	}

	protected updateSourceReference(index: number, slug: string) {
		const action = this.actionAt(index);
		const source = action?.source ?? this.defaultSource();
		const reference = this.referenceForSource(source.type, slug);
		const profileName =
			source.type === 'natural_attack'
				? (this.naturalAttacks().find(attack => attack.slug === slug)
						?.attackProfiles[0]?.name ?? '')
				: source.profileName;
		this.updateAction(index, {
			source: {
				...source,
				name: reference?.name ?? '',
				slug: reference?.slug ?? '',
				profileName
			}
		});
	}

	protected updateNaturalAttackProfile(index: number, profileName: string) {
		this.updateSource(index, { profileName });
	}

	protected updateSourceIntent(index: number, slug: string | null) {
		const action = this.actionAt(index);
		const source = action?.source ?? this.defaultSource();
		const intent = this.referenceBySlug(this.combatIntents(), slug);
		this.updateAction(index, { source: { ...source, intent } });
	}

	protected updateCost(index: number, patch: Partial<CreatureTierActionCost>) {
		const action = this.actionAt(index);
		this.updateAction(index, {
			cost: { ...(action?.cost ?? this.defaultCost()), ...patch }
		});
	}

	protected updateTarget(
		index: number,
		patch: Partial<CreatureTierActionTarget>
	) {
		const action = this.actionAt(index);
		this.updateAction(index, {
			target: { ...(action?.target ?? this.defaultTarget()), ...patch }
		});
	}

	protected addRule(actionIndex: number) {
		const action = this.actionAt(actionIndex);
		if (!action) return;
		this.updateAction(actionIndex, {
			availabilityRules: [
				...action.availabilityRules,
				{
					type: 'resource_free',
					label: 'Ресурс свободен',
					resourceKey: '',
					condition: null,
					left: null,
					operator: null,
					right: null,
					unavailableText: '',
					sortOrder: action.availabilityRules.length
				}
			]
		});
	}

	protected updateRule(
		actionIndex: number,
		ruleIndex: number,
		patch: Partial<CreatureAttackAvailabilityRule>
	) {
		const action = this.actionAt(actionIndex);
		if (!action) return;
		this.updateAction(actionIndex, {
			availabilityRules: action.availabilityRules.map((rule, index) =>
				index === ruleIndex ? { ...rule, ...patch } : rule
			)
		});
	}

	protected updateRuleType(
		actionIndex: number,
		ruleIndex: number,
		type: CreatureAttackAvailabilityRule['type']
	) {
		this.updateRule(actionIndex, ruleIndex, {
			type,
			label: this.defaultRuleLabel(type),
			resourceKey: type === 'resource_free' ? '' : '',
			condition: null,
			left: type === 'comparison' ? this.defaultComparisonLeft() : null,
			operator: type === 'comparison' ? 'lt' : null,
			right: type === 'comparison' ? this.defaultComparisonRight() : null
		});
	}

	protected comparisonOperandValue(
		operand: CreatureAttackAvailabilityComparisonOperand | null
	): ComparisonOperandValue {
		if (operand?.kind === 'actor_property' && operand.property === 'sizeRank') {
			return 'actor.sizeRank';
		}
		if (
			operand?.kind === 'target_property' &&
			operand.property === 'sizeRank'
		) {
			return 'target.sizeRank';
		}
		return 'constant';
	}

	protected updateRuleComparisonLeft(
		actionIndex: number,
		ruleIndex: number,
		value: ComparisonOperandValue
	) {
		this.updateRule(actionIndex, ruleIndex, {
			left: this.comparisonOperandFromValue(value)
		});
	}

	protected updateRuleComparisonOperator(
		actionIndex: number,
		ruleIndex: number,
		operator: CreatureAttackAvailabilityComparisonOperator
	) {
		this.updateRule(actionIndex, ruleIndex, { operator });
	}

	protected updateRuleComparisonRight(
		actionIndex: number,
		ruleIndex: number,
		value: ComparisonOperandValue
	) {
		this.updateRule(actionIndex, ruleIndex, {
			right: this.comparisonOperandFromValue(value)
		});
	}

	protected updateRuleComparisonOperandValue(
		actionIndex: number,
		ruleIndex: number,
		side: 'left' | 'right',
		value: number | null
	) {
		const action = this.actionAt(actionIndex);
		const operand = action?.availabilityRules[ruleIndex]?.[side];
		this.updateRule(actionIndex, ruleIndex, {
			[side]: {
				...(operand ?? this.comparisonOperandFromValue('constant')),
				kind: 'constant',
				property: null,
				value
			}
		});
	}

	protected updateRuleCondition(
		actionIndex: number,
		ruleIndex: number,
		slug: string | null
	) {
		this.updateRule(actionIndex, ruleIndex, {
			condition: this.referenceBySlug(this.conditions(), slug)
		});
	}

	protected removeRule(actionIndex: number, ruleIndex: number) {
		const action = this.actionAt(actionIndex);
		if (!action) return;
		this.updateAction(actionIndex, {
			availabilityRules: action.availabilityRules
				.filter((_, index) => index !== ruleIndex)
				.map((rule, index) => ({ ...rule, sortOrder: index }))
		});
	}

	protected updateRoll(index: number, patch: Partial<CreatureTierActionRoll>) {
		const action = this.actionAt(index);
		this.updateAction(index, {
			roll: { ...(action?.roll ?? this.defaultRoll()), ...patch }
		});
	}

	protected updateRollCharacteristic(index: number, name: string | null) {
		const characteristic = this.characteristics().find(
			item => item.name === name
		);
		this.updateRoll(index, {
			characteristic: characteristic
				? { name: characteristic.name, slug: characteristic.name }
				: null
		});
	}

	protected updateRollSkill(index: number, slug: string | null) {
		this.updateRoll(index, {
			skill: this.referenceBySlug(this.skills(), slug)
		});
	}

	protected updateDefense(
		index: number,
		patch: Partial<CreatureTierActionDefense>
	) {
		const action = this.actionAt(index);
		const current = action?.defense ?? this.effectiveDefense(action);
		const next = { ...current, ...patch };

		if (next.type === 'none' || !next.canParry) {
			next.parrySkillGroups = [];
		}

		this.updateAction(index, {
			defense: next
		});
	}

	protected updateDefenseOverride(index: number, enabled: boolean) {
		const action = this.actionAt(index);
		this.updateAction(index, {
			defense: enabled ? this.cloneDefense(this.effectiveDefense(action)) : null
		});
	}

	protected addEffect(actionIndex: number) {
		const action = this.actionAt(actionIndex);
		if (!action) return;
		this.updateAction(actionIndex, {
			effects: [...action.effects, this.createEffect(action.effects.length)]
		});
	}

	protected updateEffect(
		actionIndex: number,
		effectIndex: number,
		patch: Partial<CreatureTierActionEffect>
	) {
		const action = this.actionAt(actionIndex);
		if (!action) return;
		this.updateAction(actionIndex, {
			effects: action.effects.map((effect, index) =>
				index === effectIndex ? { ...effect, ...patch } : effect
			)
		});
	}

	protected updateEffectDamageType(
		actionIndex: number,
		effectIndex: number,
		slug: string | null
	) {
		this.updateEffect(actionIndex, effectIndex, {
			damageType: this.referenceBySlug(this.damageTypes(), slug)
		});
	}

	protected updateEffectCondition(
		actionIndex: number,
		effectIndex: number,
		slug: string | null
	) {
		this.updateEffect(actionIndex, effectIndex, {
			condition: this.referenceBySlug(this.conditions(), slug)
		});
	}

	protected updateEffectLinkedCondition(
		actionIndex: number,
		effectIndex: number,
		slug: string | null
	) {
		this.updateEffect(actionIndex, effectIndex, {
			linkedCondition: this.referenceBySlug(this.conditions(), slug)
		});
	}

	protected removeEffect(actionIndex: number, effectIndex: number) {
		const action = this.actionAt(actionIndex);
		if (!action) return;
		this.updateAction(actionIndex, {
			effects: action.effects
				.filter((_, index) => index !== effectIndex)
				.map((effect, index) => ({ ...effect, sortOrder: index }))
		});
	}

	protected insertToken(index: number, token: string) {
		const action = this.actionAt(index);
		if (!action) return;
		const separator = action.playerText.trim() ? ' ' : '';
		this.updateAction(index, {
			playerText: `${action.playerText}${separator}${token}`
		});
	}

	protected actionTextBlocks(action: CreatureTierAction): ActionTextBlock[] {
		return this.parseTextBlocks(
			action.playerText.trim() || this.defaultText(action)
		);
	}

	protected addTextBlock(index: number, kind: ActionTextBlock['kind']) {
		const action = this.actionAt(index);
		if (!action) return;
		const blocks = this.actionTextBlocks(action);
		const nextBlock: ActionTextBlock =
			kind === 'token' ? { kind, value: '{эффекты}' } : { kind, value: '' };
		this.updateTextBlocks(index, [...blocks, nextBlock]);
	}

	protected updateTextBlock(
		actionIndex: number,
		blockIndex: number,
		patch: Partial<ActionTextBlock>
	) {
		const action = this.actionAt(actionIndex);
		if (!action) return;
		this.updateTextBlocks(
			actionIndex,
			this.actionTextBlocks(action).map((block, index) =>
				index === blockIndex ? { ...block, ...patch } : block
			)
		);
	}

	protected removeTextBlock(actionIndex: number, blockIndex: number) {
		const action = this.actionAt(actionIndex);
		if (!action) return;
		this.updateTextBlocks(
			actionIndex,
			this.actionTextBlocks(action).filter((_, index) => index !== blockIndex)
		);
	}

	protected moveTextBlock(
		actionIndex: number,
		blockIndex: number,
		direction: -1 | 1
	) {
		const action = this.actionAt(actionIndex);
		if (!action) return;
		const blocks = this.actionTextBlocks(action);
		const nextIndex = blockIndex + direction;
		if (nextIndex < 0 || nextIndex >= blocks.length) return;
		const nextBlocks = [...blocks];
		const [block] = nextBlocks.splice(blockIndex, 1);
		if (!block) return;
		nextBlocks.splice(nextIndex, 0, block);
		this.updateTextBlocks(actionIndex, nextBlocks);
	}

	protected textBlockPreview(
		action: CreatureTierAction,
		block: ActionTextBlock
	): string {
		return block.kind === 'token'
			? this.tokenPreview(action, block.value)
			: block.value || 'Пустой текстовый блок';
	}

	protected kindLabel(kind: CreatureTierActionKind): string {
		return (
			KIND_OPTIONS.find(option => option.value === kind)?.label ?? 'Действие'
		);
	}

	protected costText(action: CreatureTierAction): string {
		switch (action.cost.mode) {
			case 'free':
				return '0 Потенциала';
			case 'fixed':
				return `${action.cost.potential ?? 0} Потенциала`;
			case 'per_meter':
				return `${action.cost.perMeter ?? 0} Потенциала за метр`;
			case 'rule':
				return 'Стоимость по правилу';
		}
	}

	protected sourceText(action: CreatureTierAction): string {
		const parts = [action.source?.name, action.source?.profileName].filter(
			Boolean
		);
		return parts.length ? parts.join(' · ') : 'Источник не задан';
	}

	protected actionButtonLabel(action: CreatureTierAction): string {
		return action.source?.intent?.name || action.name || 'Без названия';
	}

	protected renderText(action: CreatureTierAction): string {
		const template = action.playerText.trim() || this.defaultText(action);
		return this.renderTemplate(action, template, true);
	}

	protected defenseInheritanceText(action: CreatureTierAction): string {
		const text = this.defenseText(action);
		return action.defense
			? `Переопределена: ${text}`
			: `Как у источника: ${text}`;
	}

	protected effectiveDefense(
		action: CreatureTierAction | null
	): CreatureTierActionDefense {
		return (
			action?.defense ??
			this.sourceNaturalAttackProfile(action)?.defaultDefense ??
			this.defaultDefense()
		);
	}

	protected naturalAttackProfileOptions(
		action: CreatureTierAction
	): SelectOption<string>[] {
		if (action.source?.type !== 'natural_attack') return [];
		const naturalAttack = this.naturalAttacks().find(
			attack => attack.slug === action.source?.slug
		);
		return (
			naturalAttack?.attackProfiles.map(profile => ({
				label: profile.name,
				value: profile.name
			})) ?? []
		);
	}

	protected tokenPreview(action: CreatureTierAction, token: string): string {
		return this.renderTemplate(action, token, true);
	}

	private updateTextBlocks(index: number, blocks: ActionTextBlock[]) {
		this.updateAction(index, {
			playerText: blocks.map(block => block.value).join('')
		});
	}

	private parseTextBlocks(text: string): ActionTextBlock[] {
		return text
			.split(TOKEN_PATTERN)
			.filter(part => part.length > 0)
			.map(part => ({
				kind: TOKEN_VALUES.has(part) ? 'token' : 'text',
				value: part
			}));
	}

	private renderTemplate(
		action: CreatureTierAction,
		template: string,
		includeEffects: boolean
	): string {
		const replacements = this.textReplacements(action, includeEffects);
		return [...replacements.entries()].reduce(
			(text, [token, value]) => text.split(token).join(value),
			template
		);
	}

	private textReplacements(
		action: CreatureTierAction,
		includeEffects: boolean
	): Map<string, string> {
		return new Map<string, string>([
			['{существо}', this.actorName().trim() || 'Существо'],
			['{название действия}', this.actionButtonLabel(action)],
			['{стоимость}', this.costText(action)],
			['{цель}', action.target?.description || this.targetLabel(action)],
			['{источник}', this.sourceText(action)],
			['{бросок}', this.rollText(action)],
			['{защита}', this.defenseText(action)],
			['{эффекты}', includeEffects ? this.effectsText(action) : '']
		]);
	}

	private actionAt(index: number): CreatureTierAction | null {
		return this.actions()[index] ?? null;
	}

	private createActionTreeGroups(
		items: ActionViewItem[]
	): NavigationTreeGroup[] {
		const attacks = this.createSourceSubgroups(
			items.filter(item => item.action.kind === 'attack')
		);
		const conditionActions = items.filter(
			item => item.action.kind === 'condition_action'
		);
		const otherGroups = KIND_OPTIONS.filter(
			option => option.value !== 'attack' && option.value !== 'condition_action'
		)
			.map(option =>
				this.createFlatActionGroup(
					option.label,
					items.filter(item => item.action.kind === option.value)
				)
			)
			.filter(group => group.count > 0);

		return [
			{
				label: 'АТАКИ',
				count: attacks.reduce(
					(total, subgroup) => total + subgroup.items.length,
					0
				),
				subgroups: attacks,
				items: []
			},
			{
				label: 'КОНТЕКСТ',
				count: conditionActions.length,
				subgroups: conditionActions.length
					? [
							{
								label: 'По состоянию',
								items: conditionActions.map(item => this.toActionTreeItem(item))
							}
						]
					: [],
				items: []
			},
			...otherGroups
		].filter(group => group.count > 0);
	}

	private createSourceSubgroups(
		items: ActionViewItem[]
	): NavigationTreeSubgroup[] {
		const groups = new Map<string, NavigationTreeSubgroup>();

		for (const item of items) {
			const label = item.action.source?.name || 'Источник не задан';
			const group = groups.get(label) ?? { label, items: [] };
			group.items.push(this.toActionTreeItem(item));
			groups.set(label, group);
		}

		return [...groups.values()];
	}

	private createFlatActionGroup(
		label: string,
		items: ActionViewItem[]
	): NavigationTreeGroup {
		return {
			label,
			count: items.length,
			subgroups: [],
			items: items.map(item => this.toActionTreeItem(item))
		};
	}

	private toActionTreeItem(item: ActionViewItem): NavigationTreeItem {
		const label = this.actionButtonLabel(item.action);
		return {
			id: item.action.slug,
			label: item.action.isActive ? label : `${label} (выкл.)`
		};
	}

	private createAction(sortOrder: number): CreatureTierAction {
		return {
			slug: `deystvie-${Date.now()}-${sortOrder}`,
			name: 'Новое действие',
			kind: 'active_ability',
			source: this.defaultSource(),
			cost: this.defaultCost(),
			target: this.defaultTarget(),
			availabilityRules: [],
			roll: this.defaultRoll(),
			defense: null,
			effects: [],
			playerText:
				'{существо} использует действие «{название действия}». {стоимость}. {цель}. {эффекты}',
			isActive: true,
			sortOrder
		};
	}

	private defaultSource(): CreatureTierActionSource {
		return {
			type: 'custom',
			name: '',
			slug: '',
			profileName: '',
			intent: null
		};
	}

	private defaultRuleLabel(type: CreatureAttackAvailabilityRule['type']) {
		switch (type) {
			case 'resource_free':
				return 'Ресурс свободен';
			case 'active_condition':
				return 'Активное состояние';
			case 'comparison':
				return 'Сравнение';
			case 'special_rule':
				return 'Текстовое условие';
		}
	}

	private defaultComparisonLeft(): CreatureAttackAvailabilityComparisonOperand {
		return { kind: 'target_property', property: 'sizeRank', value: null };
	}

	private defaultComparisonRight(): CreatureAttackAvailabilityComparisonOperand {
		return { kind: 'actor_property', property: 'sizeRank', value: null };
	}

	private comparisonOperandFromValue(
		value: ComparisonOperandValue
	): CreatureAttackAvailabilityComparisonOperand {
		switch (value) {
			case 'actor.sizeRank':
				return { kind: 'actor_property', property: 'sizeRank', value: null };
			case 'target.sizeRank':
				return { kind: 'target_property', property: 'sizeRank', value: null };
			case 'constant':
				return { kind: 'constant', property: null, value: 0 };
		}
	}

	private toggleSetValue(
		values: ReadonlySet<string>,
		value: string
	): ReadonlySet<string> {
		const nextValues = new Set(values);
		if (nextValues.has(value)) {
			nextValues.delete(value);
		} else {
			nextValues.add(value);
		}
		return nextValues;
	}

	private defaultCost(): CreatureTierActionCost {
		return { mode: 'fixed', potential: 0, perMeter: null };
	}

	private defaultTarget(): CreatureTierActionTarget {
		return { type: 'hostile_creature', visibility: 'any', description: '' };
	}

	private defaultRoll(): CreatureTierActionRoll {
		return { type: 'none', characteristic: null, skill: null };
	}

	private defaultDefense(): CreatureTierActionDefense {
		return {
			type: 'none',
			canDodge: false,
			canParry: false,
			parrySkillGroups: []
		};
	}

	private createEffect(sortOrder: number): CreatureTierActionEffect {
		return {
			type: 'special_rule',
			value: null,
			damageMode: null,
			damageType: null,
			condition: null,
			linkedCondition: null,
			conditionDisplayName: '',
			conditionLevel: null,
			targetScope: null,
			appliesArmor: false,
			requiresDamageAfterArmor: false,
			text: '',
			sortOrder
		};
	}

	private referenceForSource(
		type: CreatureTierActionSource['type'],
		slug: string
	): CreatureTierActionReference | null {
		if (type === 'natural_attack')
			return this.referenceBySlug(this.naturalAttacks(), slug);
		if (type === 'condition')
			return this.referenceBySlug(this.conditions(), slug);
		return null;
	}

	private referenceBySlug(
		items: readonly { name: string; slug: string }[],
		slug: string | null
	): CreatureTierActionReference | null {
		const item = slug ? items.find(option => option.slug === slug) : null;
		return item ? { name: item.name, slug: item.slug } : null;
	}

	private targetLabel(action: CreatureTierAction): string {
		return (
			TARGET_TYPE_OPTIONS.find(option => option.value === action.target?.type)
				?.label ?? 'Цель не задана'
		);
	}

	private rollText(action: CreatureTierAction): string {
		if (!action.roll || action.roll.type === 'none')
			return 'Бросок не выполняется';
		if (action.roll.type === 'attack_profile')
			return 'Используется пул из профиля атаки';
		const parts = [
			action.roll.characteristic?.name,
			action.roll.skill?.name
		].filter(Boolean);
		return parts.length ? `Проверка: ${parts.join(' + ')}` : 'Проверка';
	}

	private defenseText(action: CreatureTierAction): string {
		const defense = this.effectiveDefense(action);
		if (defense.type === 'none') return 'Защита не выполняется';
		if (defense.canDodge && !defense.canParry)
			return 'Цель может защититься уклонением; парирование недоступно';
		if (!defense.canDodge && defense.canParry)
			return `Цель может защититься парированием${this.parrySkillGroupsText(defense)}`;
		if (defense.canDodge && defense.canParry)
			return `Цель может защититься уклонением или парированием${this.parrySkillGroupsText(defense)}`;
		const options = [
			defense.canDodge ? 'уклонение' : '',
			defense.canParry ? 'парирование' : ''
		].filter(Boolean);
		return options.length
			? `Цель может использовать: ${options.join(' или ')}`
			: 'Физическая защита цели';
	}

	private sourceNaturalAttackProfile(action: CreatureTierAction | null) {
		if (action?.source?.type !== 'natural_attack') {
			return null;
		}

		const naturalAttack = this.naturalAttacks().find(
			attack => attack.slug === action.source?.slug
		);
		return (
			naturalAttack?.attackProfiles.find(
				profile => profile.name === action.source?.profileName
			) ??
			naturalAttack?.attackProfiles[0] ??
			null
		);
	}

	private cloneDefense(
		defense: CreatureTierActionDefense
	): CreatureTierActionDefense {
		return {
			...defense,
			parrySkillGroups: [...defense.parrySkillGroups]
		};
	}

	private parrySkillGroupsText(defense: CreatureTierActionDefense): string {
		if (!defense.parrySkillGroups.length) {
			return '';
		}

		const labels = defense.parrySkillGroups.map(
			group =>
				PARRY_SKILL_GROUP_OPTIONS.find(option => option.value === group)
					?.label ?? group
		);

		return ` (${labels.join(', ')})`;
	}

	private effectsText(action: CreatureTierAction): string {
		const effects = [...action.effects]
			.sort((first, second) => first.sortOrder - second.sortOrder)
			.map(effect => this.effectText(action, effect))
			.filter(Boolean);
		return effects.length ? effects.join(' ') : 'Эффекты не заданы.';
	}

	private effectText(
		action: CreatureTierAction,
		effect: CreatureTierActionEffect
	): string {
		switch (effect.type) {
			case 'damage':
				return this.damageText(effect);
			case 'apply_condition':
				return `Накладывает состояние ${this.conditionName(effect)}.`;
			case 'remove_condition':
				return `Снимает состояние ${this.conditionName(effect)}.`;
			case 'link_condition':
				return effect.text
					? this.renderTemplate(action, effect.text, false)
					: `Связывает состояние ${this.conditionName(effect)} со связанным состоянием ${this.linkedConditionName(effect)}.`;
			case 'unlink_condition':
				return effect.text
					? this.renderTemplate(action, effect.text, false)
					: `Разрывает связь состояния ${this.conditionName(effect)} со связанным состоянием ${this.linkedConditionName(effect)}.`;
			case 'move_linked_target':
				return effect.text
					? this.renderTemplate(action, effect.text, false)
					: 'Перемещает связанную цель.';
			case 'dice_pool_modifier':
				return `Изменяет пул кубиков на ${effect.value ?? 0}.`;
			case 'special_rule':
				return this.renderTemplate(action, effect.text, false);
		}
	}

	private damageText(effect: CreatureTierActionEffect): string {
		const type = effect.damageType?.name
			? `${effect.damageType.name.toLowerCase()} урон`
			: 'урон';
		const armor = effect.appliesArmor
			? 'Броня применяется.'
			: 'Броня не применяется.';
		if (effect.damageMode === 'clean_successes_plus_base') {
			return `Наносит ${type}: чистые успехи + ${effect.value ?? 0}. ${armor}`;
		}
		if (effect.damageMode === 'base_damage')
			return `Наносит ${type}: ${effect.value ?? 0}. ${armor}`;
		return `Наносит ${type}: чистые успехи. ${armor}`;
	}

	private conditionName(effect: CreatureTierActionEffect): string {
		return effect.conditionDisplayName || effect.condition?.name || 'состояние';
	}

	private linkedConditionName(effect: CreatureTierActionEffect): string {
		return effect.linkedCondition?.name || 'состояние';
	}

	private defaultText(action: CreatureTierAction): string {
		return [
			this.actionButtonLabel(action),
			this.costText(action),
			action.target?.description || this.targetLabel(action),
			this.effectsText(action)
		]
			.filter(Boolean)
			.join('. ');
	}
}
