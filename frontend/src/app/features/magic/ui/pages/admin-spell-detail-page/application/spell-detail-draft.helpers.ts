import { MagicWordsRepository } from '../../../../data/magic-words-repository.port';
import { MagicWordAreaShape } from '../../../../domain/magic-word.models';
import {
	SpellConfig,
	SpellMechanicApplicationConfig,
	SpellMechanicBlockConfig
} from '../../../../domain/spell.models';
import { SpellMechanic } from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import {
	normalizeParameterValues,
	normalizeSpellConfig
} from '../mappers/spell-detail-draft.mapper';
import {
	SpellDraft,
	SpellMechanicBlockDraft
} from '../models/spell-detail-page.types';

export type SaveSpellCommand = Parameters<
	MagicWordsRepository['createSpell']
>[0];

export type SpellDraftCommandResult =
	| {
			ok: true;
			command: SaveSpellCommand;
	  }
	| {
			ok: false;
			errorMessage: string;
	  };

export function createSaveSpellCommand(
	draft: SpellDraft,
	options: {
		areaShape: MagicWordAreaShape | null;
		spellMechanics: SpellMechanic[];
	}
): SpellDraftCommandResult {
	const name = draft.name.trim();

	if (!name) {
		return { ok: false, errorMessage: 'Название заклинания обязательно.' };
	}

	return {
		ok: true,
		command: {
			actionId: draft.actionId,
			essenceId: draft.essenceId,
			gestureId: draft.gestureId,
			name,
			description: draft.description.trim(),
			config: normalizeSpellConfig(
				draft.config,
				options.areaShape,
				draft.gestureId
			),
			status: draft.status,
			isActive: draft.isActive,
			sortOrder: draft.sortOrder,
			mechanicBlocks: draft.mechanicBlocks.map((block, index) =>
				serializeMechanicBlock(block, index, options.spellMechanics)
			),
			targetConfigs: draft.targetConfigs.map((target, index) => ({
				...target,
				sortOrder: index
			})),
			textBlocks: draft.textBlocks.map((block, index) => ({
				...block,
				sortOrder: index
			}))
		}
	};
}

function serializeMechanicBlock(
	block: SpellMechanicBlockDraft,
	sortOrder: number,
	spellMechanics: SpellMechanic[]
): SaveSpellCommand['mechanicBlocks'] extends Array<infer T> | undefined
	? T
	: never {
	return {
		id: block.id,
		mechanicId: block.mechanicId,
		parameterValues: normalizeParameterValues(
			block.parameterValues,
			findMechanic(spellMechanics, block.mechanicId)?.parameters ?? []
		),
		config: normalizeBlockConfig(block, spellMechanics),
		isActive: block.isActive,
		sortOrder
	};
}

function normalizeBlockConfig(
	block: SpellMechanicBlockDraft,
	spellMechanics: SpellMechanic[]
): SpellMechanicBlockConfig {
	const config: SpellMechanicBlockConfig = {
		...block.config,
		application: mechanicApplicationConfig(block, spellMechanics)
	};
	const effectScale = config['effectScale'];

	if (!isRecord(effectScale) || !Array.isArray(effectScale['items'])) {
		return config;
	}

	return {
		...config,
		effectScale: {
			...effectScale,
			items: effectScale['items'].map((item): unknown => {
				if (!isRecord(item) || !Array.isArray(item['mechanicBlocks'])) {
					return item;
				}

				return {
					...item,
					mechanicBlocks: item['mechanicBlocks'].map(
						(nestedBlock, index): unknown =>
							isSpellMechanicBlockDraft(nestedBlock)
								? serializeMechanicBlock(nestedBlock, index, spellMechanics)
								: nestedBlock
					)
				};
			})
		}
	} as SpellMechanicBlockConfig;
}

function mechanicApplicationConfig(
	block: SpellMechanicBlockDraft,
	spellMechanics: SpellMechanic[]
): SpellMechanicApplicationConfig {
	return normalizeApplicationConfig(
		block.config.application ??
			readDefaultApplicationConfig(
				findMechanic(spellMechanics, block.mechanicId)?.configSchema ?? {}
			)
	);
}

function findMechanic(spellMechanics: SpellMechanic[], mechanicId: string) {
	return spellMechanics.find(mechanic => mechanic.id === mechanicId) ?? null;
}

function readDefaultApplicationConfig(
	configSchema: Record<string, unknown>
): Partial<SpellMechanicApplicationConfig> | null {
	const value = configSchema['defaultApplication'];

	return isRecord(value) ? value : null;
}

function normalizeApplicationConfig(
	value: Partial<SpellMechanicApplicationConfig> | null | undefined
): SpellMechanicApplicationConfig {
	return {
		visibilityRequired:
			typeof value?.visibilityRequired === 'boolean'
				? value.visibilityRequired
				: true,
		lineOfEffectRequired:
			typeof value?.lineOfEffectRequired === 'boolean'
				? value.lineOfEffectRequired
				: false
	};
}

function isSpellMechanicBlockDraft(
	value: unknown
): value is SpellMechanicBlockDraft {
	return (
		isRecord(value) &&
		typeof value['id'] === 'string' &&
		typeof value['mechanicId'] === 'string' &&
		isRecord(value['parameterValues']) &&
		isRecord(value['config']) &&
		typeof value['isActive'] === 'boolean' &&
		typeof value['sortOrder'] === 'number'
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
