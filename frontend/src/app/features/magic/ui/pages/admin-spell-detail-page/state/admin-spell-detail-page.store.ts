import { DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
	patchState,
	signalStore,
	withComputed,
	withMethods,
	withState
} from '@ngrx/signals';
import { Condition } from '../../../../../conditions/domain/conditions.models';
import {
	Creature,
	CreatureCharacteristicOption
} from '../../../../../creatures/domain/creatures.models';
import { DamageType } from '../../../../../damage-types/domain/damage-types.models';
import { ProgressionPreset } from '../../../../../progression-presets/domain/progression-presets.models';
import {
	Skill,
	SkillCategory,
	SkillLevel
} from '../../../../../skills/domain/skills.models';
import { SystemValue } from '../../../../../values/domain/values.models';
import { SpellMechanic } from '../../../../../spell-mechanics/domain/spell-mechanics.models';
import { MAGIC_WORDS_REPOSITORY } from '../../../../data/magic-words-repository.port';
import { MagicWord } from '../../../../domain/magic-word.models';
import {
	SpellRuntimePendingChoice,
	SpellRuntimePendingRoll,
	SpellRuntimePreview
} from '../../../../domain/spell.models';
import {
	AutoHelpKey,
	FormulaParameterSelection,
	RuntimeRollDraft,
	SpellDraft,
	SpellTextPreviewMode
} from '../models/spell-detail-page.types';

interface AdminSpellDetailPageState {
	draft: SpellDraft | null;
	originalDraft: SpellDraft | null;
	savedDraftSignature: string;
	activeTab: string | number | undefined;
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
	sandboxInputValues: Record<string, number>;
	selectedMechanicBlockIndex: number | null;
	selectedTargetConfigIndex: number | null;
	selectedFormulaParameter: FormulaParameterSelection | null;
	loading: boolean;
	saving: boolean;
	errorMessage: string | null;
	runtimePreviewVisible: boolean;
	runtimePreviewLoading: boolean;
	runtimePreviewError: string | null;
	runtimePreview: SpellRuntimePreview | null;
	runtimeRollResults: Record<string, number>;
	runtimeChoiceResults: Record<string, string>;
	runtimeRollDrafts: Record<string, RuntimeRollDraft>;
	addMechanicWizardVisible: boolean;
	selectedWizardMechanicId: string | null;
	spellTextPreviewMode: SpellTextPreviewMode;
	collapsedAutoSourceKeys: Set<string>;
	expandedMechanicParameterKeys: Set<string>;
	expandedCasterLevelMatrixKeys: Set<string>;
	activeAutoHelpKey: AutoHelpKey;
}

const initialState: AdminSpellDetailPageState = {
	draft: null,
	originalDraft: null,
	savedDraftSignature: '',
	activeTab: 'main',
	spellMechanics: [],
	magicWords: [],
	skills: [],
	skillCategories: [],
	skillLevels: [],
	damageTypes: [],
	conditions: [],
	creatures: [],
	creatureCharacteristics: [],
	progressionPresets: [],
	systemValues: [],
	sandboxInputValues: {},
	selectedMechanicBlockIndex: null,
	selectedTargetConfigIndex: null,
	selectedFormulaParameter: null,
	loading: true,
	saving: false,
	errorMessage: null,
	runtimePreviewVisible: false,
	runtimePreviewLoading: false,
	runtimePreviewError: null,
	runtimePreview: null,
	runtimeRollResults: {},
	runtimeChoiceResults: {},
	runtimeRollDrafts: {},
	addMechanicWizardVisible: false,
	selectedWizardMechanicId: null,
	spellTextPreviewMode: 'game',
	collapsedAutoSourceKeys: new Set(),
	expandedMechanicParameterKeys: new Set(),
	expandedCasterLevelMatrixKeys: new Set(),
	activeAutoHelpKey: 'character'
};

export const AdminSpellDetailPageStore = signalStore(
	withState(initialState),
	withComputed(({ draft, savedDraftSignature }) => ({
		hasChanges: computed(
			() => draftSignature(draft()) !== savedDraftSignature()
		)
	})),
	withMethods(store => {
		const repository = inject(MAGIC_WORDS_REPOSITORY);
		const destroyRef = inject(DestroyRef);

		return {
			setDraftSnapshot(draft: SpellDraft) {
				const nextDraft = cloneDraft(draft);

				patchState(store, state => ({
					draft: nextDraft,
					originalDraft: cloneDraft(nextDraft),
					savedDraftSignature: draftSignature(nextDraft),
					...selectedIndexesForDraft(nextDraft, state)
				}));
			},
			resetDraftSnapshot() {
				const originalDraft = store.originalDraft();

				if (!originalDraft) {
					return;
				}

				const nextDraft = cloneDraft(originalDraft);

				patchState(store, state => ({
					draft: nextDraft,
					savedDraftSignature: draftSignature(nextDraft),
					...selectedIndexesForDraft(nextDraft, state)
				}));
			},
			patchDraft(patch: Partial<SpellDraft>) {
				patchState(store, state => ({
					draft: state.draft ? { ...state.draft, ...patch } : state.draft
				}));
			},
			beginLoading() {
				patchState(store, {
					loading: true,
					errorMessage: null
				});
			},
			completeLoading() {
				patchState(store, { loading: false });
			},
			failLoading(error: unknown) {
				patchState(store, {
					errorMessage:
						error instanceof Error
							? error.message
							: 'Не удалось загрузить заклинание.',
					loading: false
				});
			},
			setSpellNotFound() {
				patchState(store, {
					errorMessage: 'Заклинание не найдено.',
					loading: false
				});
			},
			setReferenceData(referenceData: {
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
			}) {
				patchState(store, referenceData);
			},
			applySandboxInputValues(inputValues: Record<string, number>) {
				const sandboxInputValues: Record<string, number> = {};

				for (const skill of store.skills()) {
					sandboxInputValues[skill.systemValue.id] = skill.defaultLevel;
				}

				for (const value of store.systemValues()) {
					sandboxInputValues[value.id] = value.baseValue;
				}

				patchState(store, {
					sandboxInputValues: {
						...sandboxInputValues,
						...inputValues
					}
				});
			},
			setActiveTab(activeTab: string | number | undefined) {
				patchState(store, { activeTab });
			},
			selectMechanicProblem(blockIndex: number) {
				patchState(store, {
					activeTab: 'mechanics',
					selectedMechanicBlockIndex: blockIndex
				});
			},
			setSelectedMechanicBlockIndex(selectedMechanicBlockIndex: number | null) {
				patchState(store, { selectedMechanicBlockIndex });
			},
			setSelectedTargetConfigIndex(selectedTargetConfigIndex: number | null) {
				patchState(store, { selectedTargetConfigIndex });
			},
			selectAppendedTargetConfig(previousLength: number) {
				patchState(store, { selectedTargetConfigIndex: previousLength });
			},
			selectTargetConfigAfterDelete(index: number, previousLength: number) {
				const nextLength = previousLength - 1;

				patchState(store, {
					selectedTargetConfigIndex:
						nextLength > 0 ? Math.min(index, nextLength - 1) : null
				});
			},
			selectMovedTargetConfig(index: number, direction: -1 | 1) {
				patchState(store, { selectedTargetConfigIndex: index + direction });
			},
			selectAppendedMechanicBlock(previousLength: number) {
				patchState(store, {
					selectedMechanicBlockIndex: previousLength,
					addMechanicWizardVisible: false
				});
			},
			selectMechanicBlockAfterDelete(index: number, previousLength: number) {
				const nextLength = previousLength - 1;

				patchState(store, {
					selectedMechanicBlockIndex:
						nextLength > 0 ? Math.min(index, nextLength - 1) : null
				});
			},
			selectMovedMechanicBlock(index: number, direction: -1 | 1) {
				patchState(store, { selectedMechanicBlockIndex: index + direction });
			},
			setSelectedFormulaParameter(
				selectedFormulaParameter: FormulaParameterSelection | null
			) {
				patchState(store, { selectedFormulaParameter });
			},
			setSaving(saving: boolean) {
				patchState(store, { saving });
			},
			setErrorMessage(errorMessage: string | null) {
				patchState(store, { errorMessage });
			},
			setRuntimePreviewVisible(runtimePreviewVisible: boolean) {
				patchState(store, { runtimePreviewVisible });
			},
			runtimeRollKey(roll: SpellRuntimePendingRoll) {
				return `${roll.blockId}:${roll.actionId}:${roll.resultName}`;
			},
			runtimeChoiceKey(choice: SpellRuntimePendingChoice) {
				return `${choice.blockId}:${choice.actionId}`;
			},
			runtimeRollDraft(
				roll: SpellRuntimePendingRoll,
				defaultSkillLevel: number
			) {
				const key = this.runtimeRollKey(roll);

				return (
					store.runtimeRollDrafts()[key] ??
					createRuntimeRollDraft(defaultSkillLevel)
				);
			},
			resetRuntimeResults() {
				patchState(store, {
					runtimeRollResults: {},
					runtimeChoiceResults: {},
					runtimeRollDrafts: {}
				});
			},
			setRuntimeRollDraft(key: string, draft: RuntimeRollDraft) {
				patchState(store, state => ({
					runtimeRollDrafts: {
						...state.runtimeRollDrafts,
						[key]: draft
					}
				}));
			},
			setRuntimeRollResult(key: string, actionId: string, successes: number) {
				patchState(store, state => ({
					runtimeRollResults: {
						...state.runtimeRollResults,
						[key]: successes,
						[actionId]: successes
					}
				}));
			},
			setRuntimeChoiceResult(key: string, actionId: string, optionId: string) {
				patchState(store, state => ({
					runtimeChoiceResults: {
						...state.runtimeChoiceResults,
						[key]: optionId,
						[actionId]: optionId
					}
				}));
			},
			ensurePendingRuntimeRollDrafts(
				rolls: SpellRuntimePendingRoll[],
				defaultSkillLevel: number
			) {
				patchState(store, state => {
					const nextDrafts = { ...state.runtimeRollDrafts };

					for (const roll of rolls) {
						const key = this.runtimeRollKey(roll);
						nextDrafts[key] ??= createRuntimeRollDraft(defaultSkillLevel);
					}

					return { runtimeRollDrafts: nextDrafts };
				});
			},
			patchRuntimeRollDraft(
				roll: SpellRuntimePendingRoll,
				patch: Partial<RuntimeRollDraft>,
				defaultSkillLevel: number
			) {
				const key = this.runtimeRollKey(roll);
				const current = this.runtimeRollDraft(roll, defaultSkillLevel);

				this.setRuntimeRollDraft(key, {
					...current,
					...patch
				});
			},
			updateRuntimeRollDiceCount(
				roll: SpellRuntimePendingRoll,
				diceCount: number | null,
				defaultSkillLevel: number
			) {
				this.patchRuntimeRollDraft(
					roll,
					{
						diceCount: Math.max(0, Math.floor(diceCount ?? 0)),
						dice: [],
						successes: null
					},
					defaultSkillLevel
				);
			},
			updateRuntimeRollSkillLevel(
				roll: SpellRuntimePendingRoll,
				skillLevel: number | null,
				defaultSkillLevel: number
			) {
				this.patchRuntimeRollDraft(
					roll,
					{
						skillLevel: skillLevel ?? defaultSkillLevel,
						dice: [],
						successes: null
					},
					defaultSkillLevel
				);
			},
			runRuntimePreview(options: {
				resetRolls?: boolean;
				hasChanges: boolean;
				defaultSkillLevel: number;
			}) {
				const draft = store.draft();

				if (!draft?.id) {
					patchState(store, {
						runtimePreviewError: 'Сначала сохрани заклинание.',
						runtimePreviewVisible: true
					});
					return;
				}

				if (options.hasChanges) {
					patchState(store, {
						runtimePreviewError:
							'Сохрани изменения перед проверкой выполнения.',
						runtimePreviewVisible: true
					});
					return;
				}

				if (options.resetRolls ?? true) {
					this.resetRuntimeResults();
				}

				patchState(store, {
					runtimePreviewVisible: true,
					runtimePreviewLoading: true,
					runtimePreviewError: null
				});

				repository
					.executeSpellRuntimePreview(draft.id, {
						inputValues: store.sandboxInputValues(),
						rollResults: store.runtimeRollResults(),
						choiceResults: store.runtimeChoiceResults()
					})
					.pipe(takeUntilDestroyed(destroyRef))
					.subscribe({
						next: preview => {
							patchState(store, {
								runtimePreview: preview,
								runtimePreviewLoading: false
							});
							this.ensurePendingRuntimeRollDrafts(
								preview.pendingRolls,
								options.defaultSkillLevel
							);
						},
						error: error => {
							patchState(store, {
								runtimePreviewError:
									error instanceof Error
										? error.message
										: 'Не удалось выполнить preview заклинания.',
								runtimePreviewLoading: false
							});
						}
					});
			},
			submitRuntimeRoll(options: {
				roll: SpellRuntimePendingRoll;
				dice: number[];
				successes: number;
				hasChanges: boolean;
				defaultSkillLevel: number;
			}) {
				const draft = this.runtimeRollDraft(
					options.roll,
					options.defaultSkillLevel
				);
				const key = this.runtimeRollKey(options.roll);

				this.setRuntimeRollDraft(key, {
					...draft,
					dice: options.dice,
					successes: options.successes
				});
				this.setRuntimeRollResult(
					key,
					options.roll.actionId,
					options.successes
				);
				this.runRuntimePreview({
					resetRolls: false,
					hasChanges: options.hasChanges,
					defaultSkillLevel: options.defaultSkillLevel
				});
			},
			chooseRuntimePendingChoice(options: {
				choice: SpellRuntimePendingChoice;
				optionId: string;
				hasChanges: boolean;
				defaultSkillLevel: number;
			}) {
				const key = this.runtimeChoiceKey(options.choice);

				this.setRuntimeChoiceResult(
					key,
					options.choice.actionId,
					options.optionId
				);
				this.runRuntimePreview({
					resetRolls: false,
					hasChanges: options.hasChanges,
					defaultSkillLevel: options.defaultSkillLevel
				});
			},
			setAddMechanicWizardVisible(addMechanicWizardVisible: boolean) {
				patchState(store, { addMechanicWizardVisible });
			},
			setSelectedWizardMechanicId(selectedWizardMechanicId: string | null) {
				patchState(store, { selectedWizardMechanicId });
			},
			openAddMechanicWizard(selectedWizardMechanicId: string | null) {
				patchState(store, {
					selectedWizardMechanicId,
					addMechanicWizardVisible: true
				});
			},
			setSpellTextPreviewMode(spellTextPreviewMode: SpellTextPreviewMode) {
				patchState(store, { spellTextPreviewMode });
			},
			isAutoSourceCollapsed(key: string) {
				return store.collapsedAutoSourceKeys().has(key);
			},
			toggleAutoSourceCollapsed(key: string) {
				patchState(store, state => ({
					collapsedAutoSourceKeys: toggleSetValue(
						state.collapsedAutoSourceKeys,
						key
					)
				}));
			},
			isMechanicParameterExpanded(key: string) {
				return store.expandedMechanicParameterKeys().has(key);
			},
			toggleMechanicParameterExpanded(key: string) {
				patchState(store, state => ({
					expandedMechanicParameterKeys: toggleSetValue(
						state.expandedMechanicParameterKeys,
						key
					)
				}));
			},
			toggleCasterLevelMatrixExpanded(key: string) {
				patchState(store, state => ({
					expandedCasterLevelMatrixKeys: toggleSetValue(
						state.expandedCasterLevelMatrixKeys,
						key
					)
				}));
			},
			setActiveAutoHelpKey(activeAutoHelpKey: AutoHelpKey) {
				patchState(store, { activeAutoHelpKey });
			}
		};
	})
);

function createRuntimeRollDraft(skillLevel: number): RuntimeRollDraft {
	return {
		diceCount: 6,
		skillLevel,
		dice: [],
		successes: null
	};
}

function selectedIndexesForDraft(
	draft: SpellDraft,
	state: Pick<
		AdminSpellDetailPageState,
		'selectedTargetConfigIndex' | 'selectedMechanicBlockIndex'
	>
): Pick<
	AdminSpellDetailPageState,
	'selectedTargetConfigIndex' | 'selectedMechanicBlockIndex'
> {
	return {
		selectedTargetConfigIndex: draft.targetConfigs.length
			? Math.min(
					state.selectedTargetConfigIndex ?? 0,
					draft.targetConfigs.length - 1
				)
			: null,
		selectedMechanicBlockIndex: draft.mechanicBlocks.length
			? Math.min(
					state.selectedMechanicBlockIndex ?? 0,
					draft.mechanicBlocks.length - 1
				)
			: null
	};
}

function draftSignature(draft: SpellDraft | null): string {
	return draft ? JSON.stringify(draft) : '';
}

function cloneDraft(draft: SpellDraft): SpellDraft {
	return JSON.parse(JSON.stringify(draft)) as SpellDraft;
}

function toggleSetValue(values: Set<string>, value: string): Set<string> {
	const next = new Set(values);

	if (next.has(value)) {
		next.delete(value);
	} else {
		next.add(value);
	}

	return next;
}
