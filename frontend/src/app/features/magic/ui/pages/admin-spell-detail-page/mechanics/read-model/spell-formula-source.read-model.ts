import { Condition } from '../../../../../../conditions/domain/conditions.models';
import { DamageType } from '../../../../../../damage-types/domain/damage-types.models';
import {
	Skill,
	SkillCategory
} from '../../../../../../skills/domain/skills.models';
import {
	SpellMechanic,
	SpellMechanicParameter
} from '../../../../../../spell-mechanics/domain/spell-mechanics.models';
import { SystemValue } from '../../../../../../values/domain/values.models';
import { formatMechanicCalculationFormula } from '../../../../../../spell-mechanics/ui/mechanic-calculation-graph.formula';
import { SpellTargetConfig } from '../../../../../domain/spell.models';
import { SpellMechanicBlockDraft } from '../../models/spell-detail-page.types';
import {
	ESSENCE_PROFILE_SOURCE_OPTIONS,
	SpellAutoParameterValue,
	SpellFormulaParameterValue,
	autoParameterFormulaLabel,
	formulaSourceId,
	systemValueSourceLabel
} from '../../utils/spell-numeric-parameter.utils';
import {
	createTargetPreset,
	targetConfigText
} from '../../utils/spell-target-config.utils';
import { createFormulaSourceNameMap } from '../../read-model/spell-preview-context.factory';
import { formatFormulaSourceValueSummary } from './spell-mechanic-parameter-labels';

export type SpellFormulaSkillSourceMode = 'preview' | 'graph';

export interface SpellFormulaSourceContext {
	block: SpellMechanicBlockDraft;
	conditions: Condition[];
	damageTypes: DamageType[];
	mechanics: SpellMechanic[];
	progressionPresets: Array<{ id: string; name: string }>;
	skillCategories: SkillCategory[];
	skills: Skill[];
	systemValues: SystemValue[];
	targetConfigs: SpellTargetConfig[];
}

export interface SpellFormulaSourceOptions {
	skillSourceMode: SpellFormulaSkillSourceMode;
}

export function createSpellFormulaSourceGroups(
	context: SpellFormulaSourceContext,
	options: SpellFormulaSourceOptions
) {
	const mechanic = findMechanic(context.block.mechanicId, context.mechanics);
	const parameters = mechanic?.parameters ?? [];
	const labelLookup = createSpellFormulaSourceLabelLookup(context, options);
	const mechanicParameterSources = parameters
		.filter(
			parameter => parameter.kind === 'number' || parameter.kind === 'formula'
		)
		.sort(compareByOrderAndName)
		.map(parameter => ({
			id: formulaSourceId('parameter', parameterStorageKey(parameter)),
			name: formulaSourceParameterLabel(context.block, parameter, labelLookup),
			searchText: `${parameter.name} параметр число формула`
		}));
	const skillParameterSources = parameters
		.filter(parameter => parameter.kind === 'skill')
		.sort(compareByOrderAndName)
		.map(parameter => {
			const label = formulaSourceParameterLabel(
				context.block,
				parameter,
				labelLookup
			);

			return options.skillSourceMode === 'graph'
				? {
						id: formulaSourceId(
							'skillParameterLevel',
							parameterStorageKey(parameter)
						),
						name: label,
						searchText: `${parameter.name} уровень навык`
					}
				: {
						id: formulaSourceId('skill', parameterStorageKey(parameter)),
						name: `Навык: ${label}`,
						searchText: `${parameter.name} навык уровень`
					};
		});
	const staticSkillSourceGroups =
		options.skillSourceMode === 'graph'
			? createGraphSkillSourceGroups(context.skillCategories, context.skills)
			: createSingleOptionGroup(
					'Навыки',
					context.skills
						.filter(skill => skill.isActive)
						.sort(compareByOrderAndName)
						.map(skill => ({
							id: formulaSourceId('skill', skill.id),
							name: `Навык: ${skill.name}`,
							searchText: `${skill.name} навык уровень`
						}))
				);
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
		...staticSkillSourceGroups,
		...createSingleOptionGroup('Профиль сущности', essenceProfileSources),
		...createSingleOptionGroup('Ручные источники', manualSources)
	];
}

export function createSpellFormulaSourceNames(
	context: SpellFormulaSourceContext,
	options: SpellFormulaSourceOptions
) {
	return createFormulaSourceNameMap(
		createSpellFormulaSourceGroups(context, options)
	);
}

export function createSpellFormulaSourceLabelLookup(
	context: SpellFormulaSourceContext,
	options: SpellFormulaSourceOptions
) {
	return {
		progressionPresetName: (presetId: string) =>
			context.progressionPresets.find(item => item.id === presetId)?.name ??
			null,
		skillName: (value: string) =>
			context.skills.find(item => item.id === value)?.name ?? null,
		targetText: (value: string) =>
			targetConfigText(
				context.targetConfigs.find(
					item => item.id === value || item.slug === value
				) ?? createTargetPreset('Цель', 'selected', 'any', 'one')
			),
		damageTypeName: (value: string) =>
			context.damageTypes.find(item => item.id === value)?.name ?? null,
		conditionName: (value: string) =>
			context.conditions.find(item => item.id === value)?.name ?? null,
		formulaText: (value: SpellFormulaParameterValue) =>
			formatMechanicCalculationFormula(
				value.graph,
				createSpellFormulaSourceNames(context, options)
			),
		autoText: (value: SpellAutoParameterValue) =>
			autoParameterFormulaLabel(
				value,
				createSpellFormulaSourceNames(context, options)
			)
	};
}

function formulaSourceParameterLabel(
	block: SpellMechanicBlockDraft,
	parameter: SpellMechanicParameter,
	lookup: ReturnType<typeof createSpellFormulaSourceLabelLookup>
) {
	const value = block.parameterValues[parameterStorageKey(parameter)];
	const label = formatFormulaSourceValueSummary(parameter.kind, value, lookup);

	return `${parameter.name}: ${label}`;
}

function createGraphSkillSourceGroups(
	categories: SkillCategory[],
	skills: Skill[]
) {
	return categories
		.filter(category => category.isActive)
		.sort(compareByOrderAndName)
		.map(category => ({
			label: `Навыки: ${category.name}`,
			items: skills
				.filter(skill => skill.isActive && skill.categoryId === category.id)
				.sort(compareByOrderAndName)
				.map(skill => ({
					id: formulaSourceId('skillLevel', skill.id),
					name: `Уровень: ${skill.name}`,
					searchText: `${skill.name.toLowerCase()} уровень навык`
				}))
		}))
		.filter(group => group.items.length);
}

function createSingleOptionGroup<TItem>(
	label: string,
	items: TItem[]
): Array<{ label: string; items: TItem[] }> {
	return items.length ? [{ label, items }] : [];
}

function findMechanic(mechanicId: string, mechanics: SpellMechanic[]) {
	return mechanics.find(mechanic => mechanic.id === mechanicId) ?? null;
}

function parameterStorageKey(parameter: SpellMechanicParameter) {
	return parameter.slug || parameter.id;
}

function compareByOrderAndName<T extends { sortOrder?: number; name: string }>(
	left: T,
	right: T
) {
	return (
		(left.sortOrder ?? Number.MAX_SAFE_INTEGER) -
			(right.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
		left.name.localeCompare(right.name, 'ru')
	);
}

function compareBySectionAndName(
	left: Pick<SystemValueLike, 'displaySection' | 'name'>,
	right: Pick<SystemValueLike, 'displaySection' | 'name'>
) {
	return (
		left.displaySection.localeCompare(right.displaySection, 'ru') ||
		left.name.localeCompare(right.name, 'ru')
	);
}

interface SystemValueLike {
	displaySection: string;
	name: string;
}
