import { SystemValue } from '../../../../../values/domain/values.models';
import { SpellMechanicParameter } from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import {
	CommandSelectOption,
	CommandSelectOptionGroup
} from '../models/spell-detail-page.types';
import { SpellMechanicBlockDraft } from '../models/spell-detail-page.types';
import {
	AutoValueSourceKind,
	AutoValueSourceTarget,
	ESSENCE_PROFILE_SOURCE_OPTIONS,
	formulaSourceId,
	isAutoSourceMechanicParameter,
	SpellAutoParameterSource,
	SpellAutoParameterValue,
	systemValueSourceLabel
} from '../utils/spell-numeric-parameter.utils';
import { SpellMechanic } from '../../../../../spell-mechanics/domain/spell-mechanics.models';

export interface SpellAreaSourceOptionsContext {
	mechanicBlocks: SpellMechanicBlockDraft[];
	mechanics: SpellMechanic[];
	systemValues: SystemValue[];
}

export function areaSourceKeyOptionGroups(
	source: SpellAutoParameterSource,
	context: SpellAreaSourceOptionsContext
): CommandSelectOptionGroup[] {
	switch (source.sourceKind) {
		case 'mechanicParameter':
			return mechanicParameterSourceOptionGroups(context);
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

export function areaTransformSourceOptions(
	value: SpellAutoParameterValue,
	currentSource: SpellAutoParameterSource
): CommandSelectOptionGroup[] {
	const options = value.sources
		.filter(source => source.id !== currentSource.id)
		.map((source, index) => ({
			label: `${index + 1}. ${areaSourceKindLabel(source.sourceKind)}`,
			value: source.sourceKey || source.id
		}));

	return createSingleCommandOptionGroup('Влияния', options);
}

export function defaultAreaSourceKey(
	sourceKind: AutoValueSourceKind,
	context: SpellAreaSourceOptionsContext
) {
	switch (sourceKind) {
		case 'mechanicParameter':
			return mechanicParameterSourceOptions(context)[0]?.value ?? '';
		case 'systemValue':
			return (
				context.systemValues.find(value => value.name === 'Уровень Заклинателя')
					?.id ??
				context.systemValues.slice().sort(compareBySectionAndName)[0]?.id ??
				''
			);
		case 'essenceProfile':
			return 'area';
		case 'manual':
			return '';
	}
}

export function areaSourceKeyLabel(source: SpellAutoParameterSource) {
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

export function areaSourceSummary(source: SpellAutoParameterSource) {
	return `${areaSourceKindLabel(source.sourceKind)} / ${areaSourceTargetLabel(source.target)}`;
}

export function areaSourceNames(context: SpellAreaSourceOptionsContext) {
	const mechanicSources = mechanicParameterSourceOptions(context).map(
		option =>
			[
				formulaSourceId('mechanicParameter', option.value),
				option.label
			] as const
	);
	const systemSources = context.systemValues.map(
		value =>
			[
				formulaSourceId('systemValue', value.id),
				systemValueSourceLabel(value)
			] as const
	);
	const essenceSources = ESSENCE_PROFILE_SOURCE_OPTIONS.map(
		option =>
			[
				formulaSourceId('essenceProfile', option.value),
				`Профиль сущности: ${option.label}`
			] as const
	);

	return new Map([...mechanicSources, ...systemSources, ...essenceSources]);
}

function mechanicParameterSourceOptions(
	context: SpellAreaSourceOptionsContext
) {
	return mechanicParameterSourceOptionGroups(context).flatMap(
		group => group.items
	);
}

function mechanicParameterSourceOptionGroups(
	context: SpellAreaSourceOptionsContext
): CommandSelectOptionGroup[] {
	return context.mechanicBlocks.flatMap(block => {
		const mechanic = context.mechanics.find(
			item => item.id === block.mechanicId
		);

		if (!mechanic) {
			return [];
		}

		const groups = blockParameterSourceOptionGroups(block, context).map(
			group => ({
				label: `${mechanic.name} · ${group.label}`,
				items: group.items.map(item => ({
					label: item.label,
					value: areaMechanicParameterSourceKeyByStorageKey(block, item.value)
				}))
			})
		);

		return groups.filter(group => group.items.length > 0);
	});
}

function blockParameterSourceOptionGroups(
	block: SpellMechanicBlockDraft,
	context: SpellAreaSourceOptionsContext
): CommandSelectOptionGroup[] {
	const parameters = blockParameters(block, context)
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
				.filter(
					parameter =>
						parameter.kind === 'number' || parameter.kind === 'formula'
				)
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
	].filter(group => group.items.length);
}

function blockParameters(
	block: SpellMechanicBlockDraft,
	context: SpellAreaSourceOptionsContext
) {
	return (
		context.mechanics.find(item => item.id === block.mechanicId)?.parameters ??
		[]
	);
}

function systemValueSourceOptionGroups(
	systemValues: SystemValue[]
): CommandSelectOptionGroup[] {
	const groups = new Map<string, CommandSelectOption[]>();

	for (const value of systemValues.slice().sort(compareBySectionAndName)) {
		const items = groups.get(value.displaySection) ?? [];
		items.push({
			label: systemValueSourceLabel(value),
			value: value.id
		});
		groups.set(value.displaySection, items);
	}

	return Array.from(groups, ([label, items]) => ({ label, items }));
}

function parameterStorageKey(parameter: SpellMechanicParameter) {
	return parameter.slug || parameter.id;
}

function areaMechanicParameterSourceKeyByStorageKey(
	block: SpellMechanicBlockDraft,
	parameterStorageKeyValue: string
) {
	return `${block.id}:${parameterStorageKeyValue}`;
}

function createSingleCommandOptionGroup(
	label: string,
	items: CommandSelectOption[]
): CommandSelectOptionGroup[] {
	return items.length ? [{ label, items }] : [];
}

function areaSourceKindLabel(sourceKind: AutoValueSourceKind) {
	switch (sourceKind) {
		case 'systemValue':
			return 'Системное значение';
		case 'mechanicParameter':
			return 'Параметр механики';
		case 'essenceProfile':
			return 'Профиль сущности';
		case 'manual':
			return 'Ручной x';
	}
}

function areaSourceTargetLabel(target: AutoValueSourceTarget) {
	switch (target) {
		case 'base':
			return 'База';
		case 'growth':
			return 'Рост';
		case 'multiplier':
			return 'Множитель';
		case 'maximum':
			return 'Максимум';
		case 'essenceBonus':
			return 'Бонус сущности';
	}
}

function compareByOrderAndName<T extends { sortOrder?: number; name: string }>(
	first: T,
	second: T
) {
	const orderDiff = (first.sortOrder ?? 0) - (second.sortOrder ?? 0);
	return orderDiff || first.name.localeCompare(second.name, 'ru');
}

function compareBySectionAndName(
	first: Pick<SystemValue, 'displaySection' | 'name'>,
	second: Pick<SystemValue, 'displaySection' | 'name'>
) {
	return (
		first.displaySection.localeCompare(second.displaySection, 'ru') ||
		first.name.localeCompare(second.name, 'ru')
	);
}
