import {
	Skill,
	SkillCategory
} from '../../../../../skills/domain/skills.models';
import { SystemValue } from '../../../../../values/domain/values.models';
import {
	SpellMechanic,
	SpellMechanicParameter,
	SpellMechanicParameterKind
} from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import { MechanicCalculationSourceGroup } from '../../../../../spell-mechanics/ui/mechanic-calculation-graph.models';
import { parameterStorageKey } from '../mappers/spell-detail-draft.mapper';
import { SpellMechanicBlockDraft } from '../models/spell-detail-page.types';
import {
	CommandSelectOption,
	CommandSelectOptionGroup,
	compareByOrderAndName,
	compareBySectionAndName,
	createSingleCommandOptionGroup,
	createSingleOptionGroup,
	createSkillOptionGroups
} from './spell-detail-options.presenter';
import {
	AutoValueSourceKind,
	AutoValueSourceTarget,
	AUTO_VALUE_SOURCE_KIND_OPTIONS,
	AUTO_VALUE_SOURCE_TARGET_OPTIONS,
	ESSENCE_PROFILE_SOURCE_OPTIONS,
	formulaSourceId,
	isAutoSourceMechanicParameter,
	SpellAutoParameterSource,
	SpellProgressionParameterValue,
	systemValueSourceLabel
} from '../utils/spell-numeric-parameter.utils';

export interface SpellParameterSourceOptionsContext {
	mechanics: SpellMechanic[];
	skillCategories: SkillCategory[];
	skills: Skill[];
	systemValues: SystemValue[];
	parameterValueLabel(kind: SpellMechanicParameterKind, value: unknown): string;
}

export function autoTransformSourceOptions(
	value: { sources: SpellAutoParameterSource[] },
	currentSource: SpellAutoParameterSource
): CommandSelectOptionGroup[] {
	const options = value.sources
		.filter(source => source.id !== currentSource.id)
		.map((source, index) => ({
			label: `${index + 1}. ${autoSourceKindLabel(source.sourceKind)}`,
			value: source.sourceKey || source.id
		}));

	return createSingleCommandOptionGroup('Влияния', options);
}

export function autoSourceKeyOptions(
	block: SpellMechanicBlockDraft,
	source: SpellAutoParameterSource,
	context: SpellParameterSourceOptionsContext
): CommandSelectOptionGroup[] {
	switch (source.sourceKind) {
		case 'mechanicParameter':
			return mechanicParameterSourceOptionGroups(block, context);
		case 'systemValue':
			return systemValueSourceOptionGroups(context.systemValues);
		case 'essenceProfile':
			return createSingleCommandOptionGroup(
				'Профиль сущности',
				ESSENCE_PROFILE_SOURCE_OPTIONS
			);
		case 'manual':
			return [];
	}
}

export function autoSourceKeyLabel(source: SpellAutoParameterSource) {
	switch (source.sourceKind) {
		case 'mechanicParameter':
			return 'Параметр';
		case 'systemValue':
			return 'Значение системы';
		case 'essenceProfile':
			return 'Профиль';
		case 'manual':
			return '';
	}
}

export function autoSourceSummary(source: SpellAutoParameterSource) {
	return `${autoSourceKindLabel(source.sourceKind)} / ${autoSourceTargetLabel(source.target)}`;
}

export function autoSourceKindLabel(sourceKind: AutoValueSourceKind) {
	return (
		AUTO_VALUE_SOURCE_KIND_OPTIONS.find(option => option.value === sourceKind)
			?.label ?? 'Источник'
	);
}

export function autoSourceTargetLabel(target: AutoValueSourceTarget) {
	return (
		AUTO_VALUE_SOURCE_TARGET_OPTIONS.find(option => option.value === target)
			?.label ?? 'Влияние'
	);
}

export function defaultAutoSourceKey(
	block: SpellMechanicBlockDraft,
	sourceKind: AutoValueSourceKind,
	context: SpellParameterSourceOptionsContext
) {
	switch (sourceKind) {
		case 'mechanicParameter':
			return (
				mechanicBlockParameters(block, context)
					.filter(isAutoSourceMechanicParameter)
					.sort(compareByOrderAndName)
					.find(parameter => parameter.name.toLowerCase().includes('атаки'))
					?.slug ??
				mechanicBlockParameters(block, context)
					.filter(isAutoSourceMechanicParameter)
					.sort(compareByOrderAndName)[0]?.slug ??
				''
			);
		case 'systemValue':
			return (
				context.systemValues.find(value => value.name === 'Уровень Заклинателя')
					?.id ??
				context.systemValues.slice().sort(compareBySectionAndName)[0]?.id ??
				''
			);
		case 'essenceProfile':
			return 'damage';
		case 'manual':
			return '';
	}
}

export function formulaSourceGroupsForBlock(
	block: SpellMechanicBlockDraft | null,
	context: SpellParameterSourceOptionsContext
): MechanicCalculationSourceGroup[] {
	const mechanic = block ? mechanicBlockMechanic(block, context) : null;
	const parameters = mechanic?.parameters ?? [];
	const mechanicParameterSources = parameters
		.filter(
			parameter => parameter.kind === 'number' || parameter.kind === 'formula'
		)
		.sort(compareByOrderAndName)
		.map(parameter => ({
			id: formulaSourceId('parameter', parameterStorageKey(parameter)),
			name: mechanicParameterSourceLabel(block, parameter, context),
			searchText: `${parameter.name} параметр число формула`
		}));
	const skillParameterSources = parameters
		.filter(parameter => parameter.kind === 'skill')
		.sort(compareByOrderAndName)
		.map(parameter => ({
			id: formulaSourceId(
				'skillParameterLevel',
				parameterStorageKey(parameter)
			),
			name: mechanicParameterSourceLabel(block, parameter, context),
			searchText: `${parameter.name} уровень навык`
		}));
	const staticSkillSources = createSkillOptionGroups(
		context.skillCategories,
		context.skills
	).map(group => ({
		label: `Навыки: ${group.label}`,
		items: group.items.map(skill => ({
			id: formulaSourceId('skillLevel', skill.id),
			name: `Уровень: ${skill.name}`,
			searchText: `${skill.searchText} уровень навык`
		}))
	}));
	const essenceProfileSources = ESSENCE_PROFILE_SOURCE_OPTIONS.map(option => ({
		id: formulaSourceId('essenceProfile', option.value),
		name: `Профиль сущности: ${option.label}`,
		searchText: `${option.label.toLowerCase()} профиль сущности`
	}));
	const systemValueSources = context.systemValues
		.slice()
		.sort(compareBySectionAndName)
		.map(value => ({
			id: formulaSourceId('systemValue', value.id),
			name: systemValueSourceLabel(value),
			searchText:
				`${value.name} ${value.displaySection} значение системы`.toLowerCase()
		}));
	const manualSources = [
		{
			id: formulaSourceId('manual', 'x'),
			name: 'Ручной x',
			searchText: 'ручной x икс'
		}
	];

	return [
		...createSingleOptionGroup('Параметры механики', mechanicParameterSources),
		...createSingleOptionGroup('Навыки из параметров', skillParameterSources),
		...createSingleOptionGroup('Значения системы', systemValueSources),
		...staticSkillSources,
		...createSingleOptionGroup('Профиль сущности', essenceProfileSources),
		...createSingleOptionGroup('Ручные источники', manualSources)
	];
}

export function formulaSourceNamesForBlock(
	block: SpellMechanicBlockDraft,
	context: SpellParameterSourceOptionsContext
) {
	return new Map(
		formulaSourceGroupsForBlock(block, context)
			.flatMap(group => group.items)
			.map(item => [item.id, item.name] as const)
	);
}

export function progressionSourceKeyOptions(
	block: SpellMechanicBlockDraft,
	value: SpellProgressionParameterValue,
	context: SpellParameterSourceOptionsContext
): CommandSelectOption[] {
	if (value.sourceKind === 'skillLevel') {
		return mechanicBlockParameters(block, context)
			.filter(parameter => parameter.kind === 'skill')
			.sort(compareByOrderAndName)
			.map(parameter => ({
				label: parameter.name,
				value: parameterStorageKey(parameter)
			}));
	}

	if (value.sourceKind === 'essenceProfile') {
		return ESSENCE_PROFILE_SOURCE_OPTIONS.map(option => ({
			label: option.label,
			value: option.value
		}));
	}

	return [];
}

function mechanicParameterSourceOptionGroups(
	block: SpellMechanicBlockDraft,
	context: SpellParameterSourceOptionsContext
): CommandSelectOptionGroup[] {
	const parameters = mechanicBlockParameters(block, context)
		.filter(isAutoSourceMechanicParameter)
		.sort(compareByOrderAndName);

	return [
		{
			label: 'Навыки',
			items: parameters
				.filter(parameter => parameter.kind === 'skill')
				.map(parameter => ({
					label: parameter.name,
					value: parameterStorageKey(parameter)
				}))
		},
		{
			label: 'Числа',
			items: parameters
				.filter(parameter => parameter.kind === 'number')
				.map(parameter => ({
					label: parameter.name,
					value: parameterStorageKey(parameter)
				}))
		},
		{
			label: 'Значения системы',
			items: parameters
				.filter(parameter => parameter.kind === 'systemValue')
				.map(parameter => ({
					label: parameter.name,
					value: parameterStorageKey(parameter)
				}))
		}
	].filter(group => group.items.length > 0);
}

function systemValueSourceOptionGroups(
	systemValues: SystemValue[]
): CommandSelectOptionGroup[] {
	const groups = new Map<string, CommandSelectOption[]>();

	for (const value of systemValues.slice().sort(compareBySectionAndName)) {
		const label = value.displaySection || 'Значения';
		const items = groups.get(label) ?? [];
		items.push({
			label: value.name,
			value: value.id
		});
		groups.set(label, items);
	}

	return Array.from(groups, ([label, items]) => ({ label, items }));
}

function mechanicParameterSourceLabel(
	block: SpellMechanicBlockDraft | null,
	parameter: SpellMechanicParameter,
	context: SpellParameterSourceOptionsContext
) {
	const value = block
		? rawParameterValue(block, parameter.id, context)
		: undefined;
	const valueLabel =
		value === undefined
			? 'Не выбрано'
			: context.parameterValueLabel(parameter.kind, value);

	if (parameter.kind === 'skill') {
		return `Уровень: ${parameter.name} → ${valueLabel}`;
	}

	if (parameter.kind === 'systemValue') {
		return `Значение: ${parameter.name} → ${valueLabel}`;
	}

	return `Параметр: ${parameter.name} → ${valueLabel}`;
}

function rawParameterValue(
	block: SpellMechanicBlockDraft,
	parameterIdOrSlug: string,
	context: SpellParameterSourceOptionsContext
) {
	const key = blockParameterStorageKey(block, parameterIdOrSlug, context);

	return block.parameterValues[key];
}

function blockParameterStorageKey(
	block: SpellMechanicBlockDraft,
	parameterIdOrSlug: string,
	context: SpellParameterSourceOptionsContext
) {
	const parameter = mechanicBlockMechanic(block, context)?.parameters.find(
		item => item.id === parameterIdOrSlug || item.slug === parameterIdOrSlug
	);

	return parameter ? parameterStorageKey(parameter) : parameterIdOrSlug;
}

function mechanicBlockMechanic(
	block: SpellMechanicBlockDraft,
	context: SpellParameterSourceOptionsContext
) {
	return (
		context.mechanics.find(mechanic => mechanic.id === block.mechanicId) ?? null
	);
}

function mechanicBlockParameters(
	block: SpellMechanicBlockDraft,
	context: SpellParameterSourceOptionsContext
) {
	return mechanicBlockMechanic(block, context)?.parameters ?? [];
}
