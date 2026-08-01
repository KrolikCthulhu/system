import { Condition } from '../../../../../conditions/domain/conditions.models';
import { DamageType } from '../../../../../damage-types/domain/damage-types.models';
import { MagicWord } from '../../../../domain/magic-word.models';
import { ProgressionPreset } from '../../../../../progression-presets/domain/progression-presets.models';
import {
	Skill,
	SkillCategory
} from '../../../../../skills/domain/skills.models';
import {
	SpellMechanic,
	SpellMechanicParameterKind
} from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import { SystemValue } from '../../../../../values/domain/values.models';
import {
	SpellEffectScaleConfig,
	SpellMechanicApplicationConfig
} from '../../../../domain/spell.models';
import {
	SpellDraft,
	SpellMechanicBlockDraft,
	SpellTextPreviewMode
} from '../models/spell-detail-page.types';
import {
	SpellAutoParameterSource,
	SpellAutoParameterValue
} from '../utils/spell-numeric-parameter.utils';
import { evaluateAutoParameterForGameText } from './spell-auto-parameter-runtime.read-model';
import { SpellCastingReadinessContext } from './spell-casting-readiness.rules';
import { readSpellEffectScaleConfig } from './spell-effect-scale-config.mapper';
import {
	normalizeApplicationConfig,
	readDefaultApplicationConfig
} from '../application/commands/spell-mechanic-block-draft.commands';
import { SpellParameterSourceOptionsContext } from './spell-parameter-source-options.read-model';
import {
	autoSourceRuntimeValue,
	SpellRuntimeSourceResolverContext
} from './spell-runtime-source-resolver.read-model';
import {
	parameterValueLabel,
	SpellTextPreviewContext
} from './spell-text-preview.read-model';

export interface SpellPreviewContextSource {
	draft(): SpellDraft | null;
	mechanics(): SpellMechanic[];
	progressionPresets(): ProgressionPreset[];
	skills(): Skill[];
	skillCategories(): SkillCategory[];
	skillLevels(): Array<{ isActive: boolean; level: number }>;
	damageTypes(): DamageType[];
	conditions(): Condition[];
	magicWords(): MagicWord[];
	systemValues(): SystemValue[];
	sandboxInputValues(): Record<string, number>;
	textPreviewMode(): SpellTextPreviewMode;
	formulaSourceNames(): ReadonlyMap<string, string>;
}

export function createSpellTextPreviewContext(
	source: SpellPreviewContextSource
): SpellTextPreviewContext {
	return {
		draft: source.draft(),
		mechanics: source.mechanics(),
		progressionPresets: source.progressionPresets(),
		skills: source.skills(),
		damageTypes: source.damageTypes(),
		conditions: source.conditions(),
		formulaSourceNames: source.formulaSourceNames(),
		mode: source.textPreviewMode(),
		mechanicApplicationConfig: block =>
			spellMechanicApplicationConfig(block, source.mechanics()),
		effectScaleConfig: block => spellEffectScaleConfig(block),
		evaluateAutoParameterForGameText: (block, value) =>
			evaluateSpellAutoParameterForPreview(block, value, source)
	};
}

export function createSpellParameterSourceOptionsContext(
	source: SpellPreviewContextSource
): SpellParameterSourceOptionsContext {
	return {
		mechanics: source.mechanics(),
		skillCategories: source.skillCategories(),
		skills: source.skills(),
		systemValues: source.systemValues(),
		parameterValueLabel: (kind, value) =>
			spellParameterValueLabel(kind, value, source)
	};
}

export function createSpellRuntimeSourceResolverContext(
	source: SpellPreviewContextSource
): SpellRuntimeSourceResolverContext {
	return {
		essenceProfile: spellEssenceMagicWord(source)?.essenceProfile ?? null,
		mechanics: source.mechanics(),
		sandboxInputValues: source.sandboxInputValues(),
		skills: source.skills(),
		systemValues: source.systemValues()
	};
}

export function createSpellCastingReadinessContext(
	source: SpellPreviewContextSource
): SpellCastingReadinessContext {
	return {
		draft: source.draft(),
		essence: spellEssenceMagicWord(source),
		mechanics: source.mechanics(),
		runtime: createSpellRuntimeSourceResolverContext(source),
		skills: source.skills()
	};
}

export function createFormulaSourceNameMap(
	groups: Array<{ items: Array<{ id: string; name: string }> }>
) {
	return new Map(
		groups.flatMap(group => group.items).map(item => [item.id, item.name])
	);
}

export function spellMechanicApplicationConfig(
	block: SpellMechanicBlockDraft,
	mechanics: SpellMechanic[]
): SpellMechanicApplicationConfig {
	return normalizeApplicationConfig(
		block.config.application ??
			readDefaultApplicationConfig(
				spellMechanicBlockMechanic(block, mechanics)?.configSchema ?? {}
			)
	);
}

export function spellEffectScaleConfig(
	block: SpellMechanicBlockDraft
): SpellEffectScaleConfig {
	return readSpellEffectScaleConfig(block.config['effectScale']);
}

export function spellMechanicBlockMechanic(
	block: SpellMechanicBlockDraft,
	mechanics: SpellMechanic[]
) {
	return mechanics.find(mechanic => mechanic.id === block.mechanicId) ?? null;
}

function spellParameterValueLabel(
	kind: SpellMechanicParameterKind,
	value: unknown,
	source: SpellPreviewContextSource
) {
	return parameterValueLabel(
		kind,
		value,
		createSpellTextPreviewContext(source)
	);
}

function evaluateSpellAutoParameterForPreview(
	block: SpellMechanicBlockDraft,
	value: SpellAutoParameterValue,
	source: SpellPreviewContextSource
) {
	return evaluateAutoParameterForGameText(block, value, {
		maxActiveSkillLevel: spellMaxActiveSkillLevel(source),
		sourceValue: (sourceBlock, autoSource) =>
			spellAutoSourceRuntimeValue(sourceBlock, autoSource, source)
	});
}

function spellAutoSourceRuntimeValue(
	block: SpellMechanicBlockDraft,
	source: SpellAutoParameterSource,
	contextSource: SpellPreviewContextSource
) {
	return autoSourceRuntimeValue(
		block,
		source,
		createSpellRuntimeSourceResolverContext(contextSource)
	);
}

function spellMaxActiveSkillLevel(source: SpellPreviewContextSource) {
	return Math.max(
		0,
		...source
			.skillLevels()
			.filter(level => level.isActive)
			.map(level => level.level)
	);
}

function spellEssenceMagicWord(source: SpellPreviewContextSource) {
	const essenceId = source.draft()?.essenceId;

	return (
		source
			.magicWords()
			.find(word => word.id === essenceId && word.type === 'ESSENCE') ?? null
	);
}
