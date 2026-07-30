import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { CharacterSheetSandboxDraft } from '../../../../../character-sheet/domain/character-sheet-sandbox.models';
import { CHARACTER_SHEET_SANDBOX_REPOSITORY } from '../../../../../character-sheet/data/character-sheet-sandbox-repository.port';
import { Condition } from '../../../../../conditions/domain/conditions.models';
import { CONDITIONS_REPOSITORY } from '../../../../../conditions/data/conditions-repository.port';
import {
	Creature,
	CreatureCharacteristicOption
} from '../../../../../creatures/domain/creatures.models';
import { CREATURES_REPOSITORY } from '../../../../../creatures/data/creatures-repository.port';
import { DamageType } from '../../../../../damage-types/domain/damage-types.models';
import { DAMAGE_TYPES_REPOSITORY } from '../../../../../damage-types/data/damage-types-repository.port';
import { ProgressionPreset } from '../../../../../progression-presets/domain/progression-presets.models';
import { PROGRESSION_PRESETS_REPOSITORY } from '../../../../../progression-presets/data/progression-presets-repository.port';
import {
	Skill,
	SkillCategory,
	SkillLevel
} from '../../../../../skills/domain/skills.models';
import { SKILLS_REPOSITORY } from '../../../../../skills/data/skills-repository.port';
import { SpellMechanic } from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import { SPELL_MECHANICS_REPOSITORY } from '../../../../../spell-mechanics/data/spell-mechanics-repository.port';
import { SystemValue } from '../../../../../values/domain/values.models';
import { VALUES_REPOSITORY } from '../../../../../values/data/values-repository.port';
import { MAGIC_WORDS_REPOSITORY } from '../../../../data/magic-words-repository.port';
import { MagicWord } from '../../../../domain/magic-word.models';
import {
	SpellCatalog,
	SpellFormulaCandidate
} from '../../../../domain/spell.models';

export interface SpellDetailRouteParams {
	spellId: string | null;
	actionId: string | null;
	essenceId: string | null;
	gestureId: string | null;
}

export type SpellDetailLoadResult = {
	formula: SpellFormulaCandidate | null;
	referenceData: {
		spellMechanics: SpellMechanic[];
		magicWords: MagicWord[];
		skills: Skill[];
		skillCategories: SkillCategory[];
		skillLevels: SkillLevel[];
		damageTypes: DamageType[];
		conditions: Condition[];
		creatures: Creature[];
		creatureCharacteristics: CreatureCharacteristicOption[];
		progressionPresets: ProgressionPreset[];
		systemValues: SystemValue[];
		sandboxInputValues: CharacterSheetSandboxDraft['inputValues'];
	};
};

@Injectable()
export class LoadSpellDetailPageUseCase {
	private readonly magicRepository = inject(MAGIC_WORDS_REPOSITORY);
	private readonly spellMechanicsRepository = inject(
		SPELL_MECHANICS_REPOSITORY
	);
	private readonly skillsRepository = inject(SKILLS_REPOSITORY);
	private readonly damageTypesRepository = inject(DAMAGE_TYPES_REPOSITORY);
	private readonly conditionsRepository = inject(CONDITIONS_REPOSITORY);
	private readonly creaturesRepository = inject(CREATURES_REPOSITORY);
	private readonly progressionPresetsRepository = inject(
		PROGRESSION_PRESETS_REPOSITORY
	);
	private readonly valuesRepository = inject(VALUES_REPOSITORY);
	private readonly characterSheetSandboxRepository = inject(
		CHARACTER_SHEET_SANDBOX_REPOSITORY
	);

	execute(params: SpellDetailRouteParams): Observable<SpellDetailLoadResult> {
		return forkJoin({
			spells: this.magicRepository.loadSpellCatalog(),
			mechanics: this.spellMechanicsRepository.loadCatalog(),
			words: this.magicRepository.loadCatalog(),
			skills: this.skillsRepository.loadAdminCatalog(),
			damageTypes: this.damageTypesRepository.loadCatalog(),
			conditions: this.conditionsRepository.loadCatalog(),
			creatures: this.creaturesRepository.loadCatalog(),
			progressionPresets: this.progressionPresetsRepository.loadCatalog(),
			systemValues: this.valuesRepository.loadCatalog(),
			sandboxDraft: this.characterSheetSandboxRepository.loadDraft()
		}).pipe(
			map(
				({
					spells,
					mechanics,
					words,
					skills,
					damageTypes,
					conditions,
					creatures,
					progressionPresets,
					systemValues,
					sandboxDraft
				}) => ({
					formula: findFormulaFromRouteParams(spells, params),
					referenceData: {
						spellMechanics: mechanics.mechanics,
						magicWords: words.words,
						skills: skills.skills,
						skillCategories: skills.categories,
						skillLevels: skills.levels,
						damageTypes: damageTypes.damageTypes,
						conditions: conditions.conditions,
						creatures: creatures.creatures,
						creatureCharacteristics: creatures.characteristics,
						progressionPresets: progressionPresets.presets,
						systemValues: systemValues.values,
						sandboxInputValues: sandboxDraft.inputValues
					}
				})
			)
		);
	}

	loadPersistedSpell(spellId: string) {
		return this.magicRepository.loadSpell(spellId);
	}
}

function findFormulaFromRouteParams(
	catalog: SpellCatalog,
	params: SpellDetailRouteParams
): SpellFormulaCandidate | null {
	for (const group of catalog.groups) {
		for (const formula of group.formulas) {
			if (params.spellId && formula.spell?.id === params.spellId) {
				return formula;
			}

			if (
				params.actionId &&
				params.essenceId &&
				params.gestureId &&
				formula.action.id === params.actionId &&
				formula.essence.id === params.essenceId &&
				formula.gesture.id === params.gestureId
			) {
				return formula;
			}
		}
	}

	return null;
}
