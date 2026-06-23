import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import {
	ATTRIBUTES_REPOSITORY,
	AttributesRepository
} from '../../attributes/data/attributes-repository.port';
import {
	SKILLS_REPOSITORY,
	SkillsRepository
} from '../../skills/data/skills-repository.port';
import {
	VALUES_REPOSITORY,
	ValuesRepository
} from '../../values/data/values-repository.port';
import {
	CHARACTER_SHEET_SANDBOX_REPOSITORY,
	CharacterSheetSandboxRepository
} from '../data/character-sheet-sandbox-repository.port';
import {
	CharacterSheetSandboxDraft,
	CharacterSheetSandboxPageData,
	CharacterSheetSandboxRollResult
} from '../domain/character-sheet-sandbox.models';

@Injectable({ providedIn: 'root' })
export class AdminCharacterSheetFacade {
	private readonly attributesRepository = inject<AttributesRepository>(
		ATTRIBUTES_REPOSITORY
	);
	private readonly skillsRepository =
		inject<SkillsRepository>(SKILLS_REPOSITORY);
	private readonly valuesRepository =
		inject<ValuesRepository>(VALUES_REPOSITORY);
	private readonly sandboxRepository =
		inject<CharacterSheetSandboxRepository>(
			CHARACTER_SHEET_SANDBOX_REPOSITORY
		);

	loadPageData(): Observable<CharacterSheetSandboxPageData> {
		return forkJoin({
			attributes: this.attributesRepository.loadAdminCatalog(),
			skills: this.skillsRepository.loadAdminCatalog(),
			values: this.valuesRepository.loadCatalog(),
			draft: this.sandboxRepository.loadDraft()
		}).pipe(
			map(({ attributes, skills, values, draft }) => ({
				attributes: attributes.attributes,
				characteristics: attributes.characteristics,
				skillCategories: skills.categories,
				skills: skills.skills,
				skillLevels: skills.levels,
				rollConsequences: skills.rollConsequences.map(consequence => ({
					id: consequence.id,
					name: consequence.name
				})),
				systemValues: values.values,
				draft
			}))
		);
	}

	saveDraft(
		inputValues: Record<string, number>
	): Observable<CharacterSheetSandboxDraft> {
		return this.sandboxRepository.updateDraft(inputValues);
	}

	rollSkill(
		skillId: string,
		inputValues: Record<string, number>
	): Observable<CharacterSheetSandboxRollResult> {
		return this.sandboxRepository.rollSkill(skillId, inputValues);
	}
}
