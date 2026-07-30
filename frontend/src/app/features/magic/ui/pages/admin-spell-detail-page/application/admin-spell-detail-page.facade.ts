import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MagicWordAreaShape } from '../../../../domain/magic-word.models';
import { Spell } from '../../../../domain/spell.models';
import {
	createSpellDraftFromFormula,
	createSpellDraftFromSpell
} from '../mappers/spell-detail-draft.mapper';
import { SpellDraft } from '../models/spell-detail-page.types';
import { AdminSpellDetailPageStore } from '../state/admin-spell-detail-page.store';
import { DeleteSpellUseCase } from './delete-spell.use-case';
import { LoadSpellDetailPageUseCase } from './load-spell-detail-page.use-case';
import {
	createSaveSpellCommand,
	SpellDraftCommandResult
} from './spell-detail-draft.helpers';
import { SaveSpellDetailUseCase } from './save-spell-detail.use-case';

@Injectable()
export class AdminSpellDetailPageFacade {
	private readonly store = inject(AdminSpellDetailPageStore);
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly destroyRef = inject(DestroyRef);
	private readonly loadSpellDetailPage = inject(LoadSpellDetailPageUseCase);
	private readonly saveSpellDetail = inject(SaveSpellDetailUseCase);
	private readonly deleteSpellUseCase = inject(DeleteSpellUseCase);

	loadFromRoute() {
		this.store.beginLoading();

		this.loadSpellDetailPage
			.execute({
				spellId: this.route.snapshot.paramMap.get('spellId'),
				actionId: this.route.snapshot.paramMap.get('actionId'),
				essenceId: this.route.snapshot.paramMap.get('essenceId'),
				gestureId: this.route.snapshot.paramMap.get('gestureId')
			})
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: ({ formula, referenceData }) => {
					this.store.setReferenceData({
						spellMechanics: referenceData.spellMechanics,
						magicWords: referenceData.magicWords,
						skills: referenceData.skills,
						skillCategories: referenceData.skillCategories,
						skillLevels: referenceData.skillLevels,
						damageTypes: referenceData.damageTypes,
						conditions: referenceData.conditions,
						creatures: referenceData.creatures,
						creatureCharacteristics: referenceData.creatureCharacteristics,
						progressionPresets: referenceData.progressionPresets,
						systemValues: referenceData.systemValues
					});
					this.store.applySandboxInputValues(referenceData.sandboxInputValues);

					if (!formula) {
						this.store.setSpellNotFound();
						return;
					}

					if (formula.spell) {
						this.loadPersistedSpell(formula.spell.id);
						return;
					}

					this.store.setDraftSnapshot(
						createSpellDraftFromFormula(
							formula,
							this.findAreaShapeByGestureId(formula.gesture.id)
						)
					);
					this.store.completeLoading();
				},
				error: error => this.store.failLoading(error)
			});
	}

	saveDraft(draft: SpellDraft, hasChanges: boolean, saving: boolean) {
		if (!hasChanges || saving) {
			return;
		}

		const result = this.createSaveCommand(draft);

		if (result.ok === false) {
			this.store.setErrorMessage(result.errorMessage);
			return;
		}

		this.store.setSaving(true);
		this.store.setErrorMessage(null);
		this.saveSpellDetail
			.execute({
				spellId: draft.id,
				command: result.command
			})
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: saved => {
					this.setDraftFromSpell(saved);
					this.store.setSaving(false);

					if (!draft.id) {
						void this.router.navigate(['/admin/rules/spells', saved.id], {
							replaceUrl: true
						});
					}
				},
				error: error => {
					this.store.setErrorMessage(
						error instanceof Error
							? error.message
							: 'Не удалось сохранить заклинание.'
					);
					this.store.setSaving(false);
				}
			});
	}

	deleteSpell(spellId: string) {
		this.store.setSaving(true);
		this.store.setErrorMessage(null);
		this.deleteSpellUseCase
			.execute(spellId)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.store.setSaving(false);
					void this.router.navigate(['/admin/rules/spells']);
				},
				error: error => {
					this.store.setErrorMessage(
						error instanceof Error
							? error.message
							: 'Не удалось удалить заклинание.'
					);
					this.store.setSaving(false);
				}
			});
	}

	private loadPersistedSpell(spellId: string) {
		this.loadSpellDetailPage
			.loadPersistedSpell(spellId)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: spell => {
					this.setDraftFromSpell(spell);
					this.store.completeLoading();
				},
				error: error => this.store.failLoading(error)
			});
	}

	private setDraftFromSpell(spell: Spell) {
		this.store.setDraftSnapshot(
			createSpellDraftFromSpell(spell, {
				areaShape: this.findAreaShapeByGestureId(spell.gestureId),
				spellMechanics: this.store.spellMechanics()
			})
		);
	}

	private createSaveCommand(draft: SpellDraft): SpellDraftCommandResult {
		return createSaveSpellCommand(draft, {
			areaShape: this.findAreaShapeByGestureId(draft.gestureId),
			spellMechanics: this.store.spellMechanics()
		});
	}

	private findAreaShapeByGestureId(
		gestureId: string
	): MagicWordAreaShape | null {
		return (
			this.store.magicWords().find(word => word.id === gestureId)?.areaShape ??
			null
		);
	}
}
