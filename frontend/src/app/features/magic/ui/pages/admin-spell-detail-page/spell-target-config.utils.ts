import {
	SpellTargetConfig,
	SpellTargetCountMode,
	SpellTargetRelation,
	SpellTargetSource
} from '../../../domain/spell.models';
import { SpellMechanicParameter } from '../../../../spell-mechanics/domain/spell-mechanics.models';

export type TargetTemplateId =
	| 'mechanicDefault'
	| 'caster'
	| 'singleEnemy'
	| 'singleAlly'
	| 'allEnemiesArea'
	| 'allAlliesArea'
	| 'anyArea'
	| 'custom';

export interface TargetTemplateOption {
	label: string;
	value: TargetTemplateId;
}

export interface TargetTemplateOptionGroup {
	label: string;
	items: TargetTemplateOption[];
}

export const TARGET_SOURCE_OPTIONS: Array<{ label: string; value: SpellTargetSource }> = [
	{ label: 'Сам кастер', value: 'caster' },
	{ label: 'Выбор', value: 'selected' },
	{ label: 'Область', value: 'area' }
];

export const TARGET_RELATION_OPTIONS: Array<{ label: string; value: SpellTargetRelation }> = [
	{ label: 'Сам', value: 'self' },
	{ label: 'Любые', value: 'any' },
	{ label: 'Враги', value: 'enemy' },
	{ label: 'Союзники', value: 'ally' }
];

export const TARGET_COUNT_MODE_OPTIONS: Array<{ label: string; value: SpellTargetCountMode }> = [
	{ label: 'Одна', value: 'one' },
	{ label: 'Все', value: 'all' },
	{ label: 'До значения', value: 'upTo' },
	{ label: 'Ровно значение', value: 'exact' }
];

export const TARGET_COUNT_VALUE_MODE_OPTIONS: Array<{
	label: string;
	value: SpellTargetConfig['countValueMode'];
}> = [
	{ label: 'Число', value: 'fixed' },
	{ label: 'Формула', value: 'formula' }
];

export const TARGET_TEMPLATE_OPTIONS: TargetTemplateOption[] = [
	{ label: 'Дефолт механики', value: 'mechanicDefault' },
	{ label: 'Кастер', value: 'caster' },
	{ label: 'Одна вражеская цель', value: 'singleEnemy' },
	{ label: 'Одна союзная цель', value: 'singleAlly' },
	{ label: 'Все враги в области', value: 'allEnemiesArea' },
	{ label: 'Все союзники в области', value: 'allAlliesArea' },
	{ label: 'Любые цели в области', value: 'anyArea' },
	{ label: 'Вручную', value: 'custom' }
];

export type TargetConfigLike = Pick<
	SpellTargetConfig,
	| 'name'
	| 'source'
	| 'relation'
	| 'countMode'
	| 'countValueMode'
	| 'countValue'
	| 'countFormula'
	| 'targetCountParameterId'
	| 'isRequired'
>;
export function createTargetConfigFromMechanicDefault(
	defaultTarget: NonNullable<SpellMechanicParameter['defaultTargetConfig']>,
	sortOrder: number
): SpellTargetConfig {
	return {
		id: crypto.randomUUID(),
		slug: '',
		name: defaultTarget.name,
		source: defaultTarget.source,
		relation: defaultTarget.relation,
		countMode: defaultTarget.countMode,
		countValueMode: defaultTarget.countValueMode,
		countValue: defaultTarget.countValue,
		countFormula: defaultTarget.countFormula,
		targetCountParameterId: defaultTarget.targetCountParameterId,
		isRequired: defaultTarget.isRequired,
		sortOrder
	};
}

export function createDefaultTargetConfigs(): SpellTargetConfig[] {
	return [];
}

export function createTargetConfigDraft(sortOrder: number): SpellTargetConfig {
	return {
		id: crypto.randomUUID(),
		slug: '',
		name: `Цель ${sortOrder + 1}`,
		source: 'selected',
		relation: 'any',
		countMode: 'one',
		countValueMode: 'fixed',
		countValue: 1,
		countFormula: '',
		targetCountParameterId: '',
		isRequired: true,
		sortOrder
	};
}

export function createTargetConfigFromTemplate(
	templateId: TargetTemplateId,
	mechanicDefault: SpellMechanicParameter['defaultTargetConfig'],
	id: string,
	sortOrder: number,
	currentTarget: SpellTargetConfig | null = null
): SpellTargetConfig | null {
	if (templateId === 'custom') {
		const source = currentTarget ?? createTargetConfigDraft(sortOrder);

		return {
			...source,
			id,
			name:
				currentTarget && findTargetPresetTemplate(currentTarget)
					? 'Своя настройка цели'
					: source.name,
			sortOrder
		};
	}

	if (templateId === 'mechanicDefault') {
		return mechanicDefault
			? {
					id,
					slug: currentTarget?.slug ?? '',
					name: mechanicDefault.name,
					source: mechanicDefault.source,
					relation: mechanicDefault.relation,
					countMode: mechanicDefault.countMode,
					countValueMode: mechanicDefault.countValueMode,
					countValue: mechanicDefault.countValue,
					countFormula: mechanicDefault.countFormula,
					targetCountParameterId: mechanicDefault.targetCountParameterId,
					isRequired: mechanicDefault.isRequired,
					sortOrder
				}
			: null;
	}

	const preset = targetPresetConfig(templateId);

	return preset
		? {
				id,
				slug: currentTarget?.slug ?? '',
				...preset,
				sortOrder
			}
		: null;
}

export function targetPresetConfig(
	templateId: TargetTemplateId
): TargetConfigLike | null {
	switch (templateId) {
		case 'caster':
			return createTargetPreset('Кастер', 'caster', 'self', 'one');
		case 'singleEnemy':
			return createTargetPreset('Вражеская цель', 'selected', 'enemy', 'one');
		case 'singleAlly':
			return createTargetPreset('Союзная цель', 'selected', 'ally', 'one');
		case 'allEnemiesArea':
			return createTargetPreset('Все враги в области', 'area', 'enemy', 'all');
		case 'allAlliesArea':
			return createTargetPreset('Все союзники в области', 'area', 'ally', 'all');
		case 'anyArea':
			return createTargetPreset('Любые цели в области', 'area', 'any', 'all');
		case 'mechanicDefault':
		case 'custom':
			return null;
	}
}

export function createTargetTemplateOptionGroups(
	mechanicDefault: SpellMechanicParameter['defaultTargetConfig']
): TargetTemplateOptionGroup[] {
	return [
		...(mechanicDefault
			? [
					{
						label: 'Механика',
						items: TARGET_TEMPLATE_OPTIONS.filter(
							option => option.value === 'mechanicDefault'
						)
					}
				]
			: []),
		{
			label: 'Пресеты',
			items: TARGET_TEMPLATE_OPTIONS.filter(option =>
				[
					'caster',
					'singleEnemy',
					'singleAlly',
					'allEnemiesArea',
					'allAlliesArea',
					'anyArea'
				].includes(option.value)
			)
		},
		{
			label: 'Ручная настройка',
			items: TARGET_TEMPLATE_OPTIONS.filter(option => option.value === 'custom')
		}
	];
}

export function createTargetPreset(
	name: string,
	source: SpellTargetSource,
	relation: SpellTargetRelation,
	countMode: SpellTargetCountMode
): TargetConfigLike {
	return {
		name,
		source,
		relation,
		countMode,
		countValueMode: 'fixed',
		countValue: 1,
		countFormula: '',
		targetCountParameterId: '',
		isRequired: true
	};
}

export function findTargetPresetTemplate(target: SpellTargetConfig): TargetTemplateId | null {
	const presets: TargetTemplateId[] = [
		'caster',
		'singleEnemy',
		'singleAlly',
		'allEnemiesArea',
		'allAlliesArea',
		'anyArea'
	];

	return presets.find(template => {
		const preset = targetPresetConfig(template);
		return preset ? targetMatchesTemplate(target, preset) : false;
	}) ?? null;
}

export function targetMatchesTemplate(
	target: SpellTargetConfig,
	template: TargetConfigLike
) {
	return (
		target.name === template.name &&
		target.source === template.source &&
		target.relation === template.relation &&
		target.countMode === template.countMode &&
		target.countValueMode === template.countValueMode &&
		target.countValue === template.countValue &&
		target.countFormula === template.countFormula &&
		target.targetCountParameterId === template.targetCountParameterId &&
		target.isRequired === template.isRequired
	);
}

export function normalizeTargetConfigs(targets: SpellTargetConfig[]): SpellTargetConfig[] {
	return targets
		.sort(compareTargetsByOrderAndName)
		.map((target, index) => ({
			id: target.id || crypto.randomUUID(),
			slug: target.slug || target.id || '',
			name: target.name || `Цель ${index + 1}`,
			source: target.source,
			relation: target.relation,
			countMode: target.countMode,
			countValueMode: target.countValueMode,
			countValue: target.countValue,
			countFormula: target.countFormula,
			targetCountParameterId: target.targetCountParameterId ?? '',
			isRequired: target.isRequired,
			sortOrder: index
		}));
}

export function targetConfigPreview(target: TargetConfigLike) {
	if (target.source === 'caster') {
		return 'Кастер';
	}

	const area = target.source === 'area' ? ' в области' : ' на выбор';

	if (target.countMode === 'one') {
		return `${capitalizeFirst(targetOnePreview(target.relation))}${area}`;
	}

	if (target.countMode === 'all') {
		return `${capitalizeFirst(targetAllPreview(target.relation))}${area}`;
	}

	return `${capitalizeFirst(targetCountLabel(target))} ${targetPluralGenitive(target.relation)}${area}`;
}

export function targetConfigText(target: TargetConfigLike) {
	if (target.source === 'caster') {
		return 'по кастеру';
	}

	const area = target.source === 'area' ? ' в области' : '';

	if (target.countMode === 'one') {
		switch (target.relation) {
			case 'enemy':
				return `по одному вражескому существу${area}`;
			case 'ally':
				return `по одному союзнику${area}`;
			case 'self':
				return 'по кастеру';
			case 'any':
				return `по одной цели${area}`;
		}
	}

	if (target.countMode === 'all') {
		switch (target.relation) {
			case 'enemy':
				return `по всем врагам${area}`;
			case 'ally':
				return `по всем союзникам${area}`;
			case 'self':
				return 'по кастеру';
			case 'any':
				return `по всем целям${area}`;
		}
	}

	return `по ${targetPluralDative(target.relation)} (${targetCountLabel(target)}${area})`;
}

export function targetRuntimeSummary(target: TargetConfigLike) {
	return [
		`выбор: ${targetSourceRuntimeLabel(target.source)}`,
		`отношение: ${targetRelationRuntimeLabel(target.relation)}`,
		`количество: ${targetCountLabel(target)}`,
		`область: ${target.source === 'area' ? 'да' : 'нет'}`,
		`обязательная: ${target.isRequired ? 'да' : 'нет'}`
	].join('; ');
}

function targetCountLabel(target: TargetConfigLike) {
	if (target.countMode === 'one') {
		return target.relation === 'enemy'
			? 'одна'
			: target.relation === 'ally'
			? 'один'
			: 'одна';
	}

	if (target.countMode === 'all') {
		return 'все';
	}

	const value =
		target.countValueMode === 'parameter'
			? 'из параметра'
			: target.countValueMode === 'formula'
			? target.countFormula || 'формула'
			: String(target.countValue);

	return target.countMode === 'upTo' ? `до ${value}` : `ровно ${value}`;
}

function targetOnePreview(relation: SpellTargetRelation) {
	switch (relation) {
		case 'self':
			return 'кастер';
		case 'enemy':
			return 'одна вражеская цель';
		case 'ally':
			return 'один союзник';
		case 'any':
			return 'одна цель';
	}
}

function targetAllPreview(relation: SpellTargetRelation) {
	switch (relation) {
		case 'self':
			return 'кастер';
		case 'enemy':
			return 'все враги';
		case 'ally':
			return 'все союзники';
		case 'any':
			return 'все цели';
	}
}

function targetPluralGenitive(relation: SpellTargetRelation) {
	switch (relation) {
		case 'self':
			return 'кастера';
		case 'enemy':
			return 'врагов';
		case 'ally':
			return 'союзников';
		case 'any':
			return 'целей';
	}
}

function targetPluralDative(relation: SpellTargetRelation) {
	switch (relation) {
		case 'self':
			return 'кастеру';
		case 'enemy':
			return 'врагам';
		case 'ally':
			return 'союзникам';
		case 'any':
			return 'целям';
	}
}

function targetSourceRuntimeLabel(source: SpellTargetSource) {
	switch (source) {
		case 'caster':
			return 'кастер';
		case 'selected':
			return 'выбор';
		case 'area':
			return 'область';
	}
}

function targetRelationRuntimeLabel(relation: SpellTargetRelation) {
	switch (relation) {
		case 'self':
			return 'сам';
		case 'any':
			return 'любые';
		case 'enemy':
			return 'враги';
		case 'ally':
			return 'союзники';
	}
}

function capitalizeFirst(value: string) {
	return value ? value[0].toUpperCase() + value.slice(1) : value;
}

function compareTargetsByOrderAndName(
	first: Pick<SpellTargetConfig, 'sortOrder' | 'name'>,
	second: Pick<SpellTargetConfig, 'sortOrder' | 'name'>
) {
	return first.sortOrder - second.sortOrder || first.name.localeCompare(second.name, 'ru');
}
