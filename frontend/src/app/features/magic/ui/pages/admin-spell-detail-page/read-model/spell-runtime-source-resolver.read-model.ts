import { MagicWordEssenceProfile } from '../../../../domain/magic-word.models';
import { Skill } from '../../../../../skills/domain/skills.models';
import {
	CHARACTER_INPUT_OVERRIDE_KEY,
	evaluateGraph
} from '../../../../../values/domain/value-graph.engine';
import { SystemValue } from '../../../../../values/domain/values.models';
import { SpellMechanic } from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import { parameterStorageKey } from '../mappers/spell-detail-draft.mapper';
import { SpellMechanicBlockDraft } from '../models/spell-detail-page.types';
import {
	parameterValueText,
	SpellAutoParameterSource,
	supportsNumericParameterKind
} from '../utils/spell-numeric-parameter.utils';

export interface SpellRuntimeSourceResolverContext {
	essenceProfile: MagicWordEssenceProfile | null;
	mechanics: SpellMechanic[];
	sandboxInputValues: Record<string, number>;
	skills: Skill[];
	systemValues: SystemValue[];
}

export function autoSourceRuntimeValue(
	block: SpellMechanicBlockDraft,
	source: SpellAutoParameterSource,
	context: SpellRuntimeSourceResolverContext
) {
	switch (source.sourceKind) {
		case 'systemValue':
			return systemValueRuntimeValue(source.sourceKey, context);
		case 'mechanicParameter':
			return mechanicParameterRuntimeValue(block, source.sourceKey, context);
		case 'essenceProfile':
			return essenceProfileRuntimeValue(source.sourceKey, context);
		case 'manual':
			return 0;
	}
}

export function mechanicParameterRuntimeValue(
	block: SpellMechanicBlockDraft,
	parameterSlug: string,
	context: SpellRuntimeSourceResolverContext
) {
	const parameter = mechanicBlockMechanic(block, context)?.parameters.find(
		item => item.slug === parameterSlug || item.id === parameterSlug
	);
	const value = rawParameterValue(block, parameterSlug, context);

	if (parameter?.kind === 'skill') {
		const skill = skillFromParameterValue(value, context);
		return skill ? systemValueRuntimeValue(skill.systemValue.id, context) : 0;
	}

	if (parameter?.kind === 'systemValue') {
		const systemValue = systemValueFromParameterValue(value, context);
		return systemValue ? systemValueRuntimeValue(systemValue.id, context) : 0;
	}

	if (parameter && supportsNumericParameterKind(parameter.kind)) {
		const text = parameterValueText(value);
		const numericValue = Number(text.replace(',', '.'));
		return Number.isFinite(numericValue) ? numericValue : 0;
	}

	return 0;
}

export function systemValueRuntimeValue(
	systemValueIdOrSlug: string,
	context: SpellRuntimeSourceResolverContext
) {
	const systemValue = context.systemValues.find(
		item => item.id === systemValueIdOrSlug || item.slug === systemValueIdOrSlug
	);

	if (!systemValue) {
		return 0;
	}

	if (!systemValue.calculationGraph) {
		return context.sandboxInputValues[systemValue.id] ?? systemValue.baseValue;
	}

	return evaluateGraph(systemValue.calculationGraph, context.systemValues, {
		...context.sandboxInputValues,
		[CHARACTER_INPUT_OVERRIDE_KEY]:
			context.sandboxInputValues[systemValue.id] ?? systemValue.baseValue
	}).finalBase;
}

export function essenceProfileRuntimeValue(
	key: string,
	context: SpellRuntimeSourceResolverContext
) {
	const profile = context.essenceProfile;

	if (!profile) {
		return 0;
	}

	switch (key) {
		case 'damage':
			return profile.damageAffinity;
		case 'range':
			return profile.rangeAffinity;
		case 'control':
			return profile.controlAffinity;
		case 'duration':
			return profile.durationAffinity;
		case 'area':
			return profile.areaAffinity;
		case 'stability':
			return profile.stabilityAffinity;
		default:
			return 0;
	}
}

export function skillFromParameterValue(
	value: unknown,
	context: SpellRuntimeSourceResolverContext
) {
	if (typeof value === 'string') {
		return (
			context.skills.find(
				item => item.id === value || item.slug === value || item.name === value
			) ?? null
		);
	}

	if (!isRecord(value)) {
		return null;
	}

	const nested =
		(isRecord(value['defaultSkill']) && value['defaultSkill']) ||
		(isRecord(value['skill']) && value['skill']) ||
		value;
	const slug = typeof nested['slug'] === 'string' ? nested['slug'] : '';
	const id = typeof nested['id'] === 'string' ? nested['id'] : '';
	const name = typeof nested['name'] === 'string' ? nested['name'] : '';

	return (
		context.skills.find(
			item =>
				(id && item.id === id) ||
				(slug && item.slug === slug) ||
				(name && item.name === name)
		) ?? null
	);
}

function systemValueFromParameterValue(
	value: unknown,
	context: SpellRuntimeSourceResolverContext
) {
	if (typeof value === 'string') {
		return (
			context.systemValues.find(
				item => item.id === value || item.slug === value || item.name === value
			) ?? null
		);
	}

	if (!isRecord(value)) {
		return null;
	}

	const slug = typeof value['slug'] === 'string' ? value['slug'] : '';
	const id = typeof value['id'] === 'string' ? value['id'] : '';
	const name = typeof value['name'] === 'string' ? value['name'] : '';

	return (
		context.systemValues.find(
			item =>
				(id && item.id === id) ||
				(slug && item.slug === slug) ||
				(name && item.name === name)
		) ?? null
	);
}

function rawParameterValue(
	block: SpellMechanicBlockDraft,
	parameterIdOrSlug: string,
	context: SpellRuntimeSourceResolverContext
) {
	const key = blockParameterStorageKey(block, parameterIdOrSlug, context);

	return block.parameterValues[key];
}

function blockParameterStorageKey(
	block: SpellMechanicBlockDraft,
	parameterIdOrSlug: string,
	context: SpellRuntimeSourceResolverContext
) {
	const parameter = mechanicBlockMechanic(block, context)?.parameters.find(
		item => item.id === parameterIdOrSlug || item.slug === parameterIdOrSlug
	);

	return parameter ? parameterStorageKey(parameter) : parameterIdOrSlug;
}

function mechanicBlockMechanic(
	block: SpellMechanicBlockDraft,
	context: SpellRuntimeSourceResolverContext
) {
	return (
		context.mechanics.find(mechanic => mechanic.id === block.mechanicId) ?? null
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
