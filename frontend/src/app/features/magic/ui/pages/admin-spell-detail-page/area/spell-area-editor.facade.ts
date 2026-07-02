import { Injectable, computed, inject } from '@angular/core';
import { MagicWordAreaShape } from '../../../../domain/magic-word.models';
import { SystemValue } from '../../../../../values/domain/values.models';
import { SpellMechanicParameter } from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import {
	CommandSelectOption,
	CommandSelectOptionGroup,
	SpellAreaDimension,
	SpellParameterValueMode
} from '../models/spell-detail-page.types';
import { AdminSpellDetailPageStore } from '../state/admin-spell-detail-page.store';
import {
	AutoValueSourceKind,
	AutoValueSourceMode,
	AutoValueSourceTarget,
	ESSENCE_PROFILE_SOURCE_OPTIONS,
	NumericParameterPreview,
	SpellAutoParameterSource,
	SpellAutoParameterValue,
	SpellParameterValue,
	autoParameterFormulaLabel,
	autoParameterSourceLabels,
	createAutoParameterSource,
	createAutoParameterValue,
	createAutoSourcesForMode,
	createStaticParameterValue,
	evaluateAutoParameterValue,
	formatPreviewNumber,
	formulaSourceId,
	isAutoParameterValue,
	isAutoSourceMechanicParameter,
	isFormulaParameterValue,
	isProgressionParameterValue,
	isStaticParameterValue,
	parameterValueText,
	roundingLabel,
	systemValueSourceLabel
} from '../utils/spell-numeric-parameter.utils';
import { SpellMechanicBlockDraft } from '../models/spell-detail-page.types';

@Injectable()
export class SpellAreaEditorFacade {
	private readonly pageStore = inject(AdminSpellDetailPageStore);

	readonly areaShape = computed(() => {
		const gestureId = this.pageStore.draft()?.gestureId;

		return gestureId
			? (this.pageStore.magicWords().find(word => word.id === gestureId)
					?.areaShape ?? null)
			: null;
	});

	readonly dimensions = computed(() => createAreaDimensions(this.areaShape()));

	readonly parameterValueModeOptions: CommandSelectOption<SpellParameterValueMode>[] =
		[
			{ label: 'Значение', value: 'static' },
			{ label: 'Авто', value: 'auto' }
		];

	readonly progressionPreviewSteps = computed(() =>
		this.pageStore
			.skillLevels()
			.filter(level => level.isActive)
			.sort((left, right) => left.level - right.level)
			.map(level => level.level)
	);

	parameterValue(dimensionKey: string) {
		const value = this.pageStore.draft()?.config.area?.dimensions[dimensionKey];
		return isSpellParameterValue(value)
			? value
			: createStaticParameterValue('0');
	}

	parameterValueMode(dimensionKey: string): SpellParameterValueMode {
		return isAutoParameterValue(this.parameterValue(dimensionKey))
			? 'auto'
			: 'static';
	}

	staticParameterValue(dimensionKey: string) {
		return parameterValueText(this.parameterValue(dimensionKey));
	}

	updateParameterMode(
		dimension: SpellAreaDimension,
		mode: SpellParameterValueMode
	) {
		const current = this.parameterValue(dimension.key);
		const nextValue =
			mode === 'auto'
				? this.createAutoParameterValue(dimension)
				: createStaticParameterValue(parameterValueText(current));

		this.updateParameterValue(dimension.key, nextValue);
	}

	updateStaticParameterValue(dimensionKey: string, value: string) {
		this.updateParameterValue(dimensionKey, createStaticParameterValue(value));
	}

	autoParameterValue(dimensionKey: string): SpellAutoParameterValue | null {
		const value = this.parameterValue(dimensionKey);
		return isAutoParameterValue(value) ? value : null;
	}

	updateAutoParameter(
		dimensionKey: string,
		patch: Partial<SpellAutoParameterValue>
	) {
		const current = this.autoParameterValue(dimensionKey);

		if (!current) {
			return;
		}

		this.updateParameterValue(dimensionKey, {
			...current,
			...patch
		});
	}

	updateAutoSourceMode(dimensionKey: string, sourceMode: AutoValueSourceMode) {
		const current = this.autoParameterValue(dimensionKey);

		if (!current) {
			return;
		}

		this.updateAutoParameter(dimensionKey, {
			sourceMode,
			sources: createAutoSourcesForMode(sourceMode, current.sources)
		});
	}

	addAutoSource(dimensionKey: string) {
		const current = this.autoParameterValue(dimensionKey);

		if (!current) {
			return;
		}

		this.updateAutoParameter(dimensionKey, {
			sources: [...current.sources, createAutoParameterSource()]
		});
	}

	updateAutoSource(
		dimensionKey: string,
		sourceId: string,
		patch: Partial<SpellAutoParameterSource>
	) {
		const current = this.autoParameterValue(dimensionKey);

		if (!current) {
			return;
		}

		this.updateAutoParameter(dimensionKey, {
			sources: current.sources.map(source =>
				source.id === sourceId ? { ...source, ...patch } : source
			)
		});
	}

	deleteAutoSource(dimensionKey: string, sourceId: string) {
		const current = this.autoParameterValue(dimensionKey);

		if (!current || current.sources.length <= 1) {
			return;
		}

		this.updateAutoParameter(dimensionKey, {
			sources: current.sources.filter(source => source.id !== sourceId)
		});
	}

	sourceKeyOptionGroups(
		source: SpellAutoParameterSource
	): CommandSelectOptionGroup[] {
		switch (source.sourceKind) {
			case 'mechanicParameter':
				return this.mechanicParameterSourceOptionGroups();
			case 'systemValue':
				return this.systemValueSourceOptionGroups();
			case 'essenceProfile':
				return createSingleCommandOptionGroup(
					'Профиль сущности',
					ESSENCE_PROFILE_SOURCE_OPTIONS
				);
			case 'manual':
				return [];
		}
	}

	transformSourceOptions(
		value: SpellAutoParameterValue,
		currentSource: SpellAutoParameterSource
	): CommandSelectOptionGroup[] {
		const options = value.sources
			.filter(source => source.id !== currentSource.id)
			.map((source, index) => ({
				label: `${index + 1}. ${this.sourceKindLabel(source.sourceKind)}`,
				value: source.sourceKey || source.id
			}));

		return createSingleCommandOptionGroup('Влияния', options);
	}

	defaultSourceKey(sourceKind: AutoValueSourceKind) {
		switch (sourceKind) {
			case 'mechanicParameter':
				return this.mechanicParameterSourceOptions()[0]?.value ?? '';
			case 'systemValue':
				return (
					this.pageStore
						.systemValues()
						.find(value => value.name === 'Уровень Заклинателя')?.id ??
					this.pageStore.systemValues().slice().sort(compareBySectionAndName)[0]
						?.id ??
					''
				);
			case 'essenceProfile':
				return 'area';
			case 'manual':
				return '';
		}
	}

	sourceKeyLabel(source: SpellAutoParameterSource) {
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

	sourceSummary(source: SpellAutoParameterSource) {
		return `${this.sourceKindLabel(source.sourceKind)} / ${this.sourceTargetLabel(source.target)}`;
	}

	isSourceCollapsed(scope: string, source: SpellAutoParameterSource) {
		return this.pageStore.isAutoSourceCollapsed(collapseKey(scope, source));
	}

	toggleSourceCollapsed(scope: string, source: SpellAutoParameterSource) {
		this.pageStore.toggleAutoSourceCollapsed(collapseKey(scope, source));
	}

	numericPreview(dimensionKey: string): NumericParameterPreview {
		const value = this.parameterValue(dimensionKey);
		const sourceNames = this.sourceNames();

		if (isAutoParameterValue(value)) {
			return {
				formula: autoParameterFormulaLabel(value, sourceNames),
				sources: autoParameterSourceLabels(value, sourceNames),
				rounding: roundingLabel(value.roundingMode),
				values: this.progressionPreviewSteps().map(x => ({
					x,
					value: formatPreviewNumber(
						evaluateAutoParameterValue(value, x, {
							scaleMaxX: this.maxActiveSkillLevel()
						})
					)
				}))
			};
		}

		const staticValue = parameterValueText(value);

		return {
			formula: staticValue || '0',
			sources: [],
			rounding: 'Не применяется',
			values: this.progressionPreviewSteps().map(x => ({
				x,
				value: staticValue || '0'
			}))
		};
	}

	private updateParameterValue(
		dimensionKey: string,
		value: SpellParameterValue
	) {
		const draft = this.pageStore.draft();

		if (!draft) {
			return;
		}

		const area = normalizeSpellAreaConfig(
			draft.config.area,
			this.areaShape(),
			draft.gestureId
		);

		this.pageStore.patchDraft({
			config: {
				...draft.config,
				area: {
					...area,
					dimensions: {
						...area.dimensions,
						[dimensionKey]: value
					}
				}
			}
		});
	}

	private mechanicParameterSourceOptions() {
		return this.mechanicParameterSourceOptionGroups().flatMap(
			group => group.items
		);
	}

	private mechanicParameterSourceOptionGroups(): CommandSelectOptionGroup[] {
		const draft = this.pageStore.draft();

		if (!draft) {
			return [];
		}

		return draft.mechanicBlocks.flatMap(block => {
			const mechanic = this.pageStore
				.spellMechanics()
				.find(item => item.id === block.mechanicId);

			if (!mechanic) {
				return [];
			}

			const groups = this.blockParameterSourceOptionGroups(block).map(
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

	private blockParameterSourceOptionGroups(
		block: SpellMechanicBlockDraft
	): CommandSelectOptionGroup[] {
		const parameters = this.blockParameters(block)
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

	private blockParameters(block: SpellMechanicBlockDraft) {
		return (
			this.pageStore.spellMechanics().find(item => item.id === block.mechanicId)
				?.parameters ?? []
		);
	}

	private systemValueSourceOptionGroups(): CommandSelectOptionGroup[] {
		const groups = new Map<string, CommandSelectOption[]>();

		for (const value of this.pageStore
			.systemValues()
			.slice()
			.sort(compareBySectionAndName)) {
			const items = groups.get(value.displaySection) ?? [];
			items.push({
				label: systemValueSourceLabel(value),
				value: value.id
			});
			groups.set(value.displaySection, items);
		}

		return Array.from(groups, ([label, items]) => ({ label, items }));
	}

	private sourceNames() {
		const mechanicSources = this.mechanicParameterSourceOptions().map(
			option =>
				[
					formulaSourceId('mechanicParameter', option.value),
					option.label
				] as const
		);
		const systemSources = this.pageStore
			.systemValues()
			.map(
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

	private createAutoParameterValue(
		dimension: SpellAreaDimension
	): SpellAutoParameterValue {
		const value = createAutoParameterValue();

		return {
			...value,
			scale: dimension.key === 'tiles' ? 'large' : value.scale,
			sourceMode: 'advanced',
			sources: [
				createAutoParameterSource({
					sourceKind: 'systemValue',
					sourceKey: this.defaultSourceKey('systemValue'),
					target: 'base',
					curve: 'smooth',
					weight: 1
				}),
				createAutoParameterSource({
					sourceKind: 'mechanicParameter',
					sourceKey: this.defaultSourceKey('mechanicParameter'),
					target: 'growth',
					curve: 'smooth',
					weight: 1
				}),
				createAutoParameterSource({
					sourceKind: 'essenceProfile',
					sourceKey: 'area',
					target: 'multiplier',
					curve: 'weak',
					weight: 0.4
				})
			],
			essenceInfluence: 'none',
			essenceProfileKey: 'area',
			roundingMode: 'round'
		};
	}

	private sourceKindLabel(sourceKind: AutoValueSourceKind) {
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

	private sourceTargetLabel(target: AutoValueSourceTarget) {
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

	private maxActiveSkillLevel() {
		return Math.max(
			0,
			...this.pageStore
				.skillLevels()
				.filter(level => level.isActive)
				.map(level => level.level)
		);
	}
}

function normalizeSpellAreaConfig(
	config: unknown,
	areaShape: MagicWordAreaShape | null,
	gestureId: string
) {
	const dimensions = createAreaDimensions(areaShape);
	const currentDimensions =
		isRecord(config) && isRecord(config['dimensions'])
			? config['dimensions']
			: {};

	return {
		gestureId,
		shapeKind: areaShape?.kind ?? '',
		dimensions: Object.fromEntries(
			dimensions.map(dimension => [
				dimension.key,
				isSpellParameterValue(currentDimensions[dimension.key])
					? currentDimensions[dimension.key]
					: createStaticParameterValue(String(dimension.defaultValue))
			])
		)
	};
}

function createAreaDimensions(
	areaShape: MagicWordAreaShape | null
): SpellAreaDimension[] {
	if (!areaShape?.isActive) {
		return [];
	}

	return Object.entries(areaShape.dimensions.base)
		.filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
		.map(([key, value]) => ({
			key,
			label: areaDimensionLabel(key),
			defaultValue: value,
			unitLabel: areaDimensionUnitLabel(key)
		}));
}

function areaDimensionLabel(key: string) {
	switch (key) {
		case 'radius':
			return 'Радиус';
		case 'length':
			return 'Длина';
		case 'width':
			return 'Ширина';
		case 'height':
			return 'Высота';
		case 'side':
			return 'Сторона';
		case 'tiles':
			return 'Количество квадратов';
		case 'innerRadius':
			return 'Внутренний радиус';
		case 'thickness':
			return 'Толщина';
		default:
			return key;
	}
}

function areaDimensionUnitLabel(key: string) {
	return key === 'tiles' ? 'клетки 1x1' : 'клетки';
}

function isSpellParameterValue(value: unknown): value is SpellParameterValue {
	return (
		typeof value === 'string' ||
		isRecord(value) ||
		isStaticParameterValue(value) ||
		isAutoParameterValue(value) ||
		isProgressionParameterValue(value) ||
		isFormulaParameterValue(value)
	);
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

function collapseKey(scope: string, source: SpellAutoParameterSource) {
	return `${scope}:${source.id}`;
}

function createSingleCommandOptionGroup(
	label: string,
	items: CommandSelectOption[]
): CommandSelectOptionGroup[] {
	return items.length ? [{ label, items }] : [];
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

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
