import { SpellMechanicParameter } from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import { SpellMechanic } from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import {
	MechanicProblemItem,
	SpellDraft,
	SpellMechanicBlockDraft
} from '../models/spell-detail-page.types';
import {
	SpellParameterValue,
	isAutoParameterValue,
	isFormulaParameterValue,
	isProgressionParameterValue,
	isStaticParameterValue
} from '../utils/spell-numeric-parameter.utils';
import {
	normalizeParameterValues,
	parameterStorageKey
} from '../mappers/spell-detail-draft.mapper';
import { readSpellEffectScaleConfig } from './spell-effect-scale-config.mapper';

export interface MechanicReadinessStatus {
	label: string;
	severity: 'success' | 'warn' | 'danger' | 'secondary';
	issues: string[];
}

export function createMechanicProblems(
	draft: SpellDraft | null,
	spellMechanics: SpellMechanic[]
): MechanicProblemItem[] {
	if (!draft) {
		return [];
	}

	return draft.mechanicBlocks.flatMap((block, blockIndex) => {
		const status = mechanicReadinessStatus(block, draft, spellMechanics);
		const mechanicName =
			findMechanic(spellMechanics, block.mechanicId)?.name ??
			'Механика не найдена';

		return status.issues.map(issue => ({
			blockIndex,
			mechanicName,
			issue
		}));
	});
}

export function mechanicReadinessStatus(
	block: SpellMechanicBlockDraft,
	draft: SpellDraft | null,
	spellMechanics: SpellMechanic[]
): MechanicReadinessStatus {
	const mechanic = findMechanic(spellMechanics, block.mechanicId);

	if (!mechanic) {
		return {
			label: 'Ошибка',
			severity: 'danger',
			issues: ['Механика не найдена']
		};
	}

	if (!block.isActive) {
		return {
			label: 'Отключено',
			severity: 'secondary',
			issues: ['Механика отключена']
		};
	}

	const issues = mechanic.parameters
		.filter(parameter => parameter.required)
		.filter(
			parameter =>
				!isConfiguredParameterValue(
					parameter,
					rawParameterValue(block, parameter, parameter.id),
					draft
				)
		)
		.map(parameter => mechanicParameterMissingLabel(parameter));
	const effectScaleIssues = isEffectScaleBlock(block, spellMechanics)
		? effectScaleReadinessIssues(block, draft, spellMechanics)
		: [];

	return {
		label:
			issues.length || effectScaleIssues.length
				? [...issues, ...effectScaleIssues][0]
				: 'Готово',
		severity: issues.length || effectScaleIssues.length ? 'warn' : 'success',
		issues: [...issues, ...effectScaleIssues]
	};
}

export function effectScaleReadinessIssues(
	block: SpellMechanicBlockDraft,
	draft: SpellDraft | null,
	spellMechanics: SpellMechanic[]
) {
	const config = readSpellEffectScaleConfig(block.config['effectScale']);
	const issues: string[] = [];

	if (!config.items.length) {
		issues.push('Не заполнена таблица эффектов');
	}

	for (const item of config.items) {
		if (!item.name.trim()) {
			issues.push(
				`Не назван пункт шкалы ${
					item.requirement === 'automatic' ? 'без проверки' : item.threshold
				}`
			);
		}

		for (const nestedBlock of item.mechanicBlocks) {
			const nestedMechanic = findMechanic(
				spellMechanics,
				nestedBlock.mechanicId
			);

			if (!nestedMechanic) {
				issues.push(`${item.name}: вложенная механика не найдена`);
				continue;
			}
			const nestedDraft: SpellMechanicBlockDraft = {
				...nestedBlock,
				parameterValues: normalizeParameterValues(
					nestedBlock.parameterValues,
					nestedMechanic.parameters
				)
			};

			for (const parameter of nestedMechanic.parameters.filter(
				value => value.required
			)) {
				if (
					!isConfiguredParameterValue(
						parameter,
						rawParameterValue(nestedDraft, parameter, parameter.id),
						draft
					)
				) {
					issues.push(
						`${item.name}: ${mechanicParameterMissingLabel(parameter)}`
					);
				}
			}
		}
	}

	return issues;
}

export function isConfiguredParameterValue(
	parameter: SpellMechanicParameter,
	value: SpellParameterValue | undefined,
	draft: SpellDraft | null
) {
	if (parameter.kind === 'target') {
		return (
			typeof value === 'string' &&
			value.length > 0 &&
			!!draft?.targetConfigs.some(
				target => target.id === value || target.slug === value
			)
		);
	}

	if (parameter.kind === 'number' || parameter.kind === 'formula') {
		if (isStaticParameterValue(value)) {
			return value.value.trim().length > 0;
		}

		if (isProgressionParameterValue(value)) {
			return !!value.presetId;
		}

		if (isFormulaParameterValue(value)) {
			return !!value.graph?.nodes.some(node => node.kind === 'result');
		}

		if (isAutoParameterValue(value)) {
			return value.sources.length > 0;
		}

		return false;
	}

	return typeof value === 'string' ? value.trim().length > 0 : !!value;
}

export function mechanicParameterMissingLabel(
	parameter: SpellMechanicParameter
) {
	if (parameter.kind === 'target') {
		return 'Не выбрана цель';
	}

	if (parameter.kind === 'damageType') {
		return 'Не выбран тип урона';
	}

	if (parameter.kind === 'condition') {
		return 'Не выбрано состояние';
	}

	if (parameter.kind === 'skill') {
		return `Не выбран ${parameter.name.toLocaleLowerCase('ru')}`;
	}

	if (parameter.kind === 'number' || parameter.kind === 'formula') {
		switch (parameter.numericRole) {
			case 'range':
				return 'Не настроена дальность';
			case 'damage':
				return 'Не настроен урон';
			case 'duration':
				return 'Не настроена длительность';
			case 'area':
				return 'Не настроена область';
			case 'targetCount':
				return 'Не настроено количество целей';
			default:
				return `Не настроено ${parameter.name.toLocaleLowerCase('ru')}`;
		}
	}

	return `Не заполнено ${parameter.name.toLocaleLowerCase('ru')}`;
}

function isEffectScaleBlock(
	block: SpellMechanicBlockDraft,
	spellMechanics: SpellMechanic[]
) {
	return (
		findMechanic(spellMechanics, block.mechanicId)?.actions.some(
			action => action.kind === 'effectScale'
		) ?? false
	);
}

function rawParameterValue(
	block: SpellMechanicBlockDraft,
	parameter: SpellMechanicParameter | null,
	parameterIdOrSlug: string
) {
	const key = parameter ? parameterStorageKey(parameter) : parameterIdOrSlug;

	return block.parameterValues[key];
}

function findMechanic(spellMechanics: SpellMechanic[], mechanicId: string) {
	return spellMechanics.find(mechanic => mechanic.id === mechanicId) ?? null;
}
