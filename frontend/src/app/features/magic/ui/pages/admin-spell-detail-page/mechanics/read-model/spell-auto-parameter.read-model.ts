import { inject, Injectable } from '@angular/core';
import { SpellMechanicParameter } from '../../../../../../spell-mechanics/domain/spell-mechanics.models';
import { AdminSpellDetailPageStore } from '../../state/admin-spell-detail-page.store';
import { SpellMechanicBlockDraft } from '../../models/spell-detail-page.types';
import {
	AUTO_VALUE_CHARACTER_OPTIONS,
	AUTO_VALUE_SCALE_OPTIONS,
	AUTO_VALUE_SOURCE_CURVE_OPTIONS,
	AUTO_VALUE_SOURCE_KIND_OPTIONS,
	AUTO_VALUE_SOURCE_MODE_OPTIONS,
	AUTO_VALUE_SOURCE_TARGET_OPTIONS,
	AUTO_VALUE_SOURCE_TRANSFORM_OPTIONS,
	AutoValueSourceKind,
	ESSENCE_PROFILE_SOURCE_OPTIONS,
	SpellAutoParameterSource,
	SpellAutoParameterValue,
	createAutoPresetOptions,
	isAutoParameterValue,
	isAutoSourceMechanicParameter
} from '../../utils/spell-numeric-parameter.utils';
import { SpellMechanicParameterReadModel } from './spell-mechanic-parameter.read-model';

@Injectable()
export class SpellAutoParameterReadModel {
	private readonly store = inject(AdminSpellDetailPageStore);
	private readonly parameterReadModel = inject(SpellMechanicParameterReadModel);

	readonly autoValueCharacterOptions = AUTO_VALUE_CHARACTER_OPTIONS;
	readonly autoValueScaleOptions = AUTO_VALUE_SCALE_OPTIONS;
	readonly autoValueRangeModeOptions: Array<{
		label: string;
		value: SpellAutoParameterValue['rangeMode'];
	}> = [
		{ label: 'Без диапазона', value: 'none' },
		{ label: 'Масштабировать', value: 'scale' }
	];
	readonly autoValueSourceModeOptions = AUTO_VALUE_SOURCE_MODE_OPTIONS;
	readonly autoValueSourceKindOptions = AUTO_VALUE_SOURCE_KIND_OPTIONS;
	readonly autoValueSourceTargetOptions = AUTO_VALUE_SOURCE_TARGET_OPTIONS;
	readonly autoValueSourceCurveOptions = AUTO_VALUE_SOURCE_CURVE_OPTIONS;
	readonly autoValueSourceTransformOptions =
		AUTO_VALUE_SOURCE_TRANSFORM_OPTIONS;
	readonly autoPresetPanelStyle = {
		width: '12rem',
		maxWidth: '12rem',
		overflowX: 'hidden'
	};

	readonly autoTransformSourceOptions = (
		value: SpellAutoParameterValue,
		currentSource: SpellAutoParameterSource
	) => [
		{
			label: 'Влияния',
			items: value.sources
				.filter(source => source.id !== currentSource.id)
				.map((source, index) => ({
					label: `${index + 1}. ${this.autoSourceKindLabel(source.sourceKind)}`,
					value: source.sourceKey || source.id
				}))
		}
	];

	readonly autoSourceKeyLabel = (source: SpellAutoParameterSource) => {
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
	};

	readonly autoSourceSummary = (source: SpellAutoParameterSource) =>
		`${this.autoSourceKindLabel(source.sourceKind)} / ${this.autoSourceTargetLabel(source.target)}`;

	readonly isAutoSourceCollapsed = (
		scope: string,
		source: SpellAutoParameterSource
	) =>
		this.store.isAutoSourceCollapsed(this.autoSourceCollapseKey(scope, source));

	autoParameterValue(block: SpellMechanicBlockDraft, parameterId: string) {
		const value = this.parameterReadModel.rawParameterValue(block, parameterId);
		return isAutoParameterValue(value) ? value : null;
	}

	mechanicAutoSourceKeyOptionsRenderer(block: SpellMechanicBlockDraft) {
		return (source: SpellAutoParameterSource) =>
			this.autoSourceKeyOptions(block, source);
	}

	defaultAutoSourceKeyRenderer(block: SpellMechanicBlockDraft) {
		return (sourceKind: AutoValueSourceKind) =>
			this.defaultAutoSourceKey(block, sourceKind);
	}

	autoPresetOptions(parameter: SpellMechanicParameter) {
		return createAutoPresetOptions(parameter.numericRole);
	}

	defaultAutoSourceKey(
		block: SpellMechanicBlockDraft,
		sourceKind: AutoValueSourceKind
	) {
		switch (sourceKind) {
			case 'mechanicParameter':
				return (
					this.parameterReadModel
						.mechanicBlockParameters(block)
						.filter(isAutoSourceMechanicParameter)
						.sort(compareByOrderAndName)
						.find(parameter => parameter.name.toLowerCase().includes('атаки'))
						?.slug ??
					this.parameterReadModel
						.mechanicBlockParameters(block)
						.filter(isAutoSourceMechanicParameter)
						.sort(compareByOrderAndName)[0]?.slug ??
					''
				);
			case 'systemValue':
				return (
					this.store
						.systemValues()
						.find(value => value.name === 'Уровень Заклинателя')?.id ??
					this.store.systemValues().slice().sort(compareBySectionAndName)[0]
						?.id ??
					''
				);
			case 'essenceProfile':
				return 'damage';
			case 'manual':
				return '';
		}
	}

	autoSourceCollapseKey(scope: string, source: SpellAutoParameterSource) {
		return `${scope}:${source.id}`;
	}

	private autoSourceKeyOptions(
		block: SpellMechanicBlockDraft,
		source: SpellAutoParameterSource
	) {
		switch (source.sourceKind) {
			case 'mechanicParameter':
				return this.mechanicParameterSourceOptionGroups(block);
			case 'systemValue':
				return this.systemValueSourceOptionGroups();
			case 'essenceProfile':
				return [
					{
						label: 'Профиль сущности',
						items: ESSENCE_PROFILE_SOURCE_OPTIONS
					}
				];
			case 'manual':
				return [];
		}
	}

	private mechanicParameterSourceOptionGroups(block: SpellMechanicBlockDraft) {
		const parameters = this.parameterReadModel
			.mechanicBlockParameters(block)
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

	private systemValueSourceOptionGroups() {
		const groups = new Map<string, Array<{ label: string; value: string }>>();

		for (const value of this.store
			.systemValues()
			.slice()
			.sort(compareBySectionAndName)) {
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

	private autoSourceKindLabel(sourceKind: AutoValueSourceKind) {
		return (
			this.autoValueSourceKindOptions.find(
				option => option.value === sourceKind
			)?.label ?? 'Источник'
		);
	}

	private autoSourceTargetLabel(target: SpellAutoParameterSource['target']) {
		return (
			this.autoValueSourceTargetOptions.find(option => option.value === target)
				?.label ?? 'Влияние'
		);
	}
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
