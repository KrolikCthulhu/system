import {
	SpellEffectScaleConfig,
	SpellEffectScaleItemConfig,
	SpellEffectScaleMode
} from '../../../../domain/spell.models';
import { normalizeParameterValues } from '../mappers/spell-detail-draft.mapper';
import { SpellMechanicBlockDraft } from '../models/spell-detail-page.types';

export function readSpellEffectScaleConfig(
	value: unknown
): SpellEffectScaleConfig {
	const config = toRecord(value);
	const mode = isEffectScaleMode(config['mode']) ? config['mode'] : 'choice';
	const resultName =
		typeof config['resultName'] === 'string' && config['resultName'].trim()
			? config['resultName']
			: 'Выбранный эффект';

	return {
		mode,
		resultName,
		items: readSpellEffectScaleItems(config['items'])
	};
}

function readSpellEffectScaleItems(
	value: unknown
): SpellEffectScaleItemConfig[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(isRecord).map((item, index) => ({
		id:
			typeof item['id'] === 'string' && item['id']
				? item['id']
				: crypto.randomUUID(),
		requirement:
			item['requirement'] === 'automatic' || item['requirement'] === 'successes'
				? item['requirement']
				: 'successes',
		threshold:
			typeof item['threshold'] === 'number' &&
			Number.isFinite(item['threshold'])
				? item['threshold']
				: index,
		name:
			typeof item['name'] === 'string' && item['name'].trim()
				? item['name']
				: `${index} успехов`,
		description:
			typeof item['description'] === 'string' ? item['description'] : '',
		isOpenEnded: item['isOpenEnded'] === true,
		mechanicBlocks: readNestedSpellMechanicBlocks(item['mechanicBlocks'])
	}));
}

function readNestedSpellMechanicBlocks(
	value: unknown
): SpellMechanicBlockDraft[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(isRecord).map((item, index) => ({
		id:
			typeof item['id'] === 'string' && item['id']
				? item['id']
				: crypto.randomUUID(),
		mechanicId:
			typeof item['mechanicId'] === 'string' ? item['mechanicId'] : '',
		parameterValues: isRecord(item['parameterValues'])
			? normalizeParameterValues(item['parameterValues'], [])
			: {},
		config: isRecord(item['config']) ? item['config'] : {},
		isActive: typeof item['isActive'] === 'boolean' ? item['isActive'] : true,
		sortOrder:
			typeof item['sortOrder'] === 'number' &&
			Number.isFinite(item['sortOrder'])
				? item['sortOrder']
				: index
	}));
}

function isEffectScaleMode(value: unknown): value is SpellEffectScaleMode {
	return (
		value === 'best' ||
		value === 'choice' ||
		value === 'all' ||
		value === 'exact'
	);
}

function toRecord(value: unknown): Record<string, unknown> {
	return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
