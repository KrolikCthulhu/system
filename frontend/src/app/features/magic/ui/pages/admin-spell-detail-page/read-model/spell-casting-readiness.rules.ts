import { MagicWord } from '../../../../domain/magic-word.models';
import { Skill } from '../../../../../skills/domain/skills.models';
import { SpellMechanic } from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import { parameterStorageKey } from '../mappers/spell-detail-draft.mapper';
import {
	SpellDraft,
	SpellMechanicBlockDraft
} from '../models/spell-detail-page.types';
import {
	skillFromParameterValue,
	SpellRuntimeSourceResolverContext,
	systemValueRuntimeValue
} from './spell-runtime-source-resolver.read-model';

const SPELL_CASTING_UNAVAILABLE_REASON =
	'Недоступно: требуется хотя бы одно связанное Понимание выше 0.';

export interface SpellCastingReadinessContext {
	draft: SpellDraft | null;
	essence: MagicWord | null;
	mechanics: SpellMechanic[];
	runtime: SpellRuntimeSourceResolverContext;
	skills: Skill[];
}

export function spellCastingUnavailableReason(
	context: SpellCastingReadinessContext
) {
	const linkedUnderstandingSkills = linkedSpellUnderstandingSkills(context);

	if (
		linkedUnderstandingSkills.length &&
		linkedUnderstandingSkills.some(
			skill =>
				systemValueRuntimeValue(skill.systemValue.id, context.runtime) > 0
		)
	) {
		return null;
	}

	return SPELL_CASTING_UNAVAILABLE_REASON;
}

function linkedSpellUnderstandingSkills(context: SpellCastingReadinessContext) {
	const skillsById = new Map<string, Skill>();

	for (const skillId of context.essence?.skillIds ?? []) {
		const skill = context.skills.find(
			item => item.id === skillId || item.slug === skillId
		);

		if (skill && isUnderstandingSkill(skill)) {
			skillsById.set(skill.id, skill);
		}
	}

	for (const block of context.draft?.mechanicBlocks ?? []) {
		const mechanic = mechanicBlockMechanic(block, context);

		for (const parameter of mechanic?.parameters ?? []) {
			if (parameter.kind !== 'skill') {
				continue;
			}

			const skill = skillFromParameterValue(
				rawParameterValue(block, parameter.id, context),
				context.runtime
			);

			if (skill && isUnderstandingSkill(skill)) {
				skillsById.set(skill.id, skill);
			}
		}
	}

	return [...skillsById.values()];
}

function rawParameterValue(
	block: SpellMechanicBlockDraft,
	parameterIdOrSlug: string,
	context: SpellCastingReadinessContext
) {
	const key = blockParameterStorageKey(block, parameterIdOrSlug, context);

	return block.parameterValues[key];
}

function blockParameterStorageKey(
	block: SpellMechanicBlockDraft,
	parameterIdOrSlug: string,
	context: SpellCastingReadinessContext
) {
	const parameter = mechanicBlockMechanic(block, context)?.parameters.find(
		item => item.id === parameterIdOrSlug || item.slug === parameterIdOrSlug
	);

	return parameter ? parameterStorageKey(parameter) : parameterIdOrSlug;
}

function mechanicBlockMechanic(
	block: SpellMechanicBlockDraft,
	context: SpellCastingReadinessContext
) {
	return (
		context.mechanics.find(mechanic => mechanic.id === block.mechanicId) ?? null
	);
}

function isUnderstandingSkill(skill: Skill) {
	return skill.name.toLocaleLowerCase('ru').includes('понимание');
}
