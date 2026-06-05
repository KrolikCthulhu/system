import { CommonModule } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	DestroyRef,
	computed,
	inject,
	signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { CONDITIONS_REPOSITORY } from '../../../../conditions/data/conditions-repository.port';
import { Condition } from '../../../../conditions/domain/conditions.models';
import { DAMAGE_TYPES_REPOSITORY } from '../../../../damage-types/data/damage-types-repository.port';
import { DamageType } from '../../../../damage-types/domain/damage-types.models';
import { SKILLS_REPOSITORY } from '../../../../skills/data/skills-repository.port';
import { Skill, SkillCategory } from '../../../../skills/domain/skills.models';
import { SPELL_MECHANICS_REPOSITORY } from '../../../../spell-mechanics/data/spell-mechanics-repository.port';
import {
	SpellMechanic,
	SpellMechanicParameter,
	SpellMechanicParameterKind
} from '../../../../spell-mechanics/domain/spell-mechanics.models';
import { MAGIC_WORDS_REPOSITORY } from '../../../data/magic-words-repository.port';
import { MagicWord } from '../../../domain/magic-word.models';
import {
	PersistedSpellStatus,
	SPELL_STATUS_OPTIONS,
	Spell,
	SpellCatalog,
	SpellFormulaCandidate,
	SpellMechanicBlock,
	SpellTargetConfig,
	SpellTargetCountMode,
	SpellTargetCountValueMode,
	SpellTargetRelation,
	SpellTargetSource,
	canManageSpellActivity,
	spellStatusLabel
} from '../../../domain/spell.models';

interface SelectOption {
	id: string;
	name: string;
	searchText: string;
}

interface SelectOptionGroup {
	label: string;
	items: SelectOption[];
}

interface SpellMechanicBlockDraft {
	id: string;
	mechanicId: string;
	parameterValues: Record<string, string>;
	isActive: boolean;
	sortOrder: number;
}

interface SpellDraft {
	id: string | null;
	actionId: string;
	essenceId: string;
	gestureId: string;
	formulaName: string;
	name: string;
	description: string;
	status: PersistedSpellStatus;
	isActive: boolean;
	sortOrder: number;
	targetConfigs: SpellTargetConfig[];
	mechanicBlocks: SpellMechanicBlockDraft[];
}

const TARGET_SOURCE_OPTIONS: Array<{ label: string; value: SpellTargetSource }> = [
	{ label: 'Кастер', value: 'caster' },
	{ label: 'Выбор', value: 'selected' },
	{ label: 'Область', value: 'area' }
];

const TARGET_RELATION_OPTIONS: Array<{ label: string; value: SpellTargetRelation }> = [
	{ label: 'Сам', value: 'self' },
	{ label: 'Любые', value: 'any' },
	{ label: 'Враги', value: 'enemy' },
	{ label: 'Союзники', value: 'ally' }
];

const TARGET_COUNT_MODE_OPTIONS: Array<{ label: string; value: SpellTargetCountMode }> = [
	{ label: 'Одна', value: 'one' },
	{ label: 'Все', value: 'all' },
	{ label: 'До значения', value: 'upTo' },
	{ label: 'Ровно значение', value: 'exact' }
];

const TARGET_COUNT_VALUE_MODE_OPTIONS: Array<{
	label: string;
	value: SpellTargetCountValueMode;
}> = [
	{ label: 'Число', value: 'fixed' },
	{ label: 'Формула', value: 'formula' }
];

@Component({
	selector: 'app-admin-spell-detail-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Breadcrumb,
		Button,
		ConfirmDialog,
		InputNumber,
		InputText,
		Select,
		Tab,
		TabList,
		TabPanel,
		TabPanels,
		Tabs,
		Tag,
		Textarea,
		ToggleSwitch,
		EditorActionsBarComponent
	],
	templateUrl: './admin-spell-detail-page.component.html',
	styleUrl: './admin-spell-detail-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ConfirmationService]
})
export class AdminSpellDetailPageComponent {
	private readonly repository = inject(MAGIC_WORDS_REPOSITORY);
	private readonly spellMechanicsRepository = inject(SPELL_MECHANICS_REPOSITORY);
	private readonly skillsRepository = inject(SKILLS_REPOSITORY);
	private readonly damageTypesRepository = inject(DAMAGE_TYPES_REPOSITORY);
	private readonly conditionsRepository = inject(CONDITIONS_REPOSITORY);
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly statusOptions = SPELL_STATUS_OPTIONS;
	protected readonly draft = signal<SpellDraft | null>(null);
	protected readonly spellMechanics = signal<SpellMechanic[]>([]);
	protected readonly magicWords = signal<MagicWord[]>([]);
	protected readonly skills = signal<Skill[]>([]);
	protected readonly skillCategories = signal<SkillCategory[]>([]);
	protected readonly damageTypes = signal<DamageType[]>([]);
	protected readonly conditions = signal<Condition[]>([]);
	protected readonly selectedMechanicBlockIndex = signal<number | null>(null);
	protected readonly selectedTargetConfigIndex = signal<number | null>(null);
	protected readonly activeTab = signal<string | number | undefined>('main');
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly breadcrumbs = computed(() => [
		{ label: 'Правила системы', routerLink: '/admin/rules/spells' },
		{ label: 'Заклинания', routerLink: '/admin/rules/spells' },
		{ label: this.draft()?.name || 'Заклинание' }
	]);
	protected readonly hasChanges = computed(
		() => draftSignature(this.draft()) !== this.savedDraftSignature()
	);
	protected readonly mechanicOptions = computed(() =>
		this.spellMechanics()
			.filter(mechanic => mechanic.isActive)
			.sort(compareByOrderAndName)
			.map(mechanic => ({
				label: mechanic.name,
				value: mechanic.id
			}))
	);
	protected readonly selectedMechanicBlock = computed(() => {
		const index = this.selectedMechanicBlockIndex();
		return index === null ? null : (this.draft()?.mechanicBlocks[index] ?? null);
	});
	protected readonly selectedTargetConfig = computed(() => {
		const index = this.selectedTargetConfigIndex();
		return index === null ? null : (this.draft()?.targetConfigs[index] ?? null);
	});
	protected readonly targetSourceOptions = TARGET_SOURCE_OPTIONS;
	protected readonly targetRelationOptions = TARGET_RELATION_OPTIONS;
	protected readonly targetCountModeOptions = TARGET_COUNT_MODE_OPTIONS;
	protected readonly targetCountValueModeOptions = TARGET_COUNT_VALUE_MODE_OPTIONS;

	constructor() {
		this.loadSpell();
	}

	protected updateDraftName(name: string) {
		this.patchDraft({ name });
	}

	protected updateDraftDescription(description: string) {
		this.patchDraft({ description });
	}

	protected updateDraftStatus(status: PersistedSpellStatus) {
		this.draft.update(draft =>
			draft
				? {
						...draft,
						status,
						isActive:
							status === 'DRAFT'
								? false
								: draft.status === 'DRAFT'
									? true
									: draft.isActive
					}
				: draft
		);
	}

	protected updateDraftActive(isActive: boolean) {
		this.patchDraft({ isActive });
	}

	protected updateDraftSortOrder(sortOrder: number | null) {
		this.patchDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected setActiveTab(value: string | number | undefined) {
		this.activeTab.set(value);
	}

	protected addTargetConfig() {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			targetConfigs: [
				...draft.targetConfigs,
				createTargetConfigDraft(draft.targetConfigs.length)
			]
		});
		this.selectedTargetConfigIndex.set(draft.targetConfigs.length);
	}

	protected selectTargetConfig(index: number) {
		this.selectedTargetConfigIndex.set(index);
	}

	protected updateSelectedTargetConfig(patch: Partial<SpellTargetConfig>) {
		const index = this.selectedTargetConfigIndex();
		const draft = this.draft();

		if (index === null || !draft?.targetConfigs[index]) {
			return;
		}

		this.patchDraft({
			targetConfigs: draft.targetConfigs.map((target, targetIndex) =>
				targetIndex === index ? { ...target, ...patch } : target
			)
		});
	}

	protected deleteSelectedTargetConfig() {
		const index = this.selectedTargetConfigIndex();

		if (index !== null) {
			this.deleteTargetConfig(index);
		}
	}

	protected deleteTargetConfig(index: number) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			targetConfigs: draft.targetConfigs
				.filter((_, targetIndex) => targetIndex !== index)
				.map((target, targetIndex) => ({ ...target, sortOrder: targetIndex }))
		});
		const nextLength = draft.targetConfigs.length - 1;
		this.selectedTargetConfigIndex.set(
			nextLength > 0 ? Math.min(index, nextLength - 1) : null
		);
	}

	protected moveTargetConfig(index: number, direction: -1 | 1) {
		const draft = this.draft();
		const nextIndex = index + direction;

		if (!draft || nextIndex < 0 || nextIndex >= draft.targetConfigs.length) {
			return;
		}

		const targets = [...draft.targetConfigs];
		const current = targets[index];
		const next = targets[nextIndex];

		if (!current || !next) {
			return;
		}

		targets[index] = next;
		targets[nextIndex] = current;
		this.patchDraft({
			targetConfigs: targets.map((target, targetIndex) => ({
				...target,
				sortOrder: targetIndex
			}))
		});
		this.selectedTargetConfigIndex.set(nextIndex);
	}

	protected isFirstTargetConfig(index: number) {
		return index === 0;
	}

	protected isLastTargetConfig(index: number) {
		return index === (this.draft()?.targetConfigs.length ?? 0) - 1;
	}

	protected targetConfigPreview(target: SpellTargetConfig) {
		const source = optionLabel(this.targetSourceOptions, target.source);
		const relation = optionLabel(this.targetRelationOptions, target.relation);
		const count = targetCountLabel(target);

		return `${source}, ${relation.toLowerCase()}, ${count.toLowerCase()}`;
	}

	protected addMechanicBlock() {
		const mechanic = this.spellMechanics()
			.filter(item => item.isActive)
			.sort(compareByOrderAndName)[0];

		if (!mechanic) {
			return;
		}

		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			...createMechanicBlockPatch(
				draft,
				mechanic,
				this.essenceMagicWord()
			)
		});
		this.selectedMechanicBlockIndex.set(draft.mechanicBlocks.length);
	}

	protected selectMechanicBlock(index: number) {
		this.selectedMechanicBlockIndex.set(index);
	}

	protected updateMechanicBlockMechanic(index: number, mechanicId: string) {
		const mechanic = this.findMechanic(mechanicId);

		if (!mechanic) {
			return;
		}

		const draft = this.draft();
		const existingBlock = draft?.mechanicBlocks[index];

		if (!draft || !existingBlock) {
			return;
		}

		this.patchDraft(
			createMechanicBlockPatch(
				{
					...draft,
					mechanicBlocks: draft.mechanicBlocks.filter(
						(_, blockIndex) => blockIndex !== index
					)
				},
				mechanic,
				this.essenceMagicWord(),
				existingBlock.id,
				index
			)
		);
		this.selectedMechanicBlockIndex.set(index);
	}

	protected updateMechanicBlockActive(index: number, isActive: boolean) {
		const block = this.draft()?.mechanicBlocks[index];

		if (block) {
			this.updateMechanicBlock(index, { ...block, isActive });
		}
	}

	protected updateMechanicBlockParameter(
		blockIndex: number,
		parameterId: string,
		value: string | null
	) {
		const block = this.draft()?.mechanicBlocks[blockIndex];

		if (!block) {
			return;
		}

		this.updateMechanicBlock(blockIndex, {
			...block,
			parameterValues: {
				...block.parameterValues,
				[parameterId]: value ?? ''
			}
		});
	}

	protected updateSelectedMechanicBlockMechanic(mechanicId: string) {
		const index = this.selectedMechanicBlockIndex();

		if (index !== null) {
			this.updateMechanicBlockMechanic(index, mechanicId);
		}
	}

	protected updateSelectedMechanicBlockActive(isActive: boolean) {
		const index = this.selectedMechanicBlockIndex();

		if (index !== null) {
			this.updateMechanicBlockActive(index, isActive);
		}
	}

	protected updateSelectedMechanicBlockParameter(
		parameterId: string,
		value: string | null
	) {
		const index = this.selectedMechanicBlockIndex();

		if (index !== null) {
			this.updateMechanicBlockParameter(index, parameterId, value);
		}
	}

	protected deleteSelectedMechanicBlock() {
		const index = this.selectedMechanicBlockIndex();

		if (index !== null) {
			this.deleteMechanicBlock(index);
		}
	}

	protected deleteMechanicBlock(index: number) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			mechanicBlocks: draft.mechanicBlocks
				.filter((_, blockIndex) => blockIndex !== index)
				.map((block, blockIndex) => ({ ...block, sortOrder: blockIndex }))
		});
		const nextLength = draft.mechanicBlocks.length - 1;
		this.selectedMechanicBlockIndex.set(
			nextLength > 0 ? Math.min(index, nextLength - 1) : null
		);
	}

	protected moveMechanicBlock(index: number, direction: -1 | 1) {
		const draft = this.draft();
		const nextIndex = index + direction;

		if (!draft || nextIndex < 0 || nextIndex >= draft.mechanicBlocks.length) {
			return;
		}

		const blocks = [...draft.mechanicBlocks];
		const current = blocks[index];
		const next = blocks[nextIndex];

		if (!current || !next) {
			return;
		}

		blocks[index] = next;
		blocks[nextIndex] = current;
		this.patchDraft({
			mechanicBlocks: blocks.map((block, blockIndex) => ({
				...block,
				sortOrder: blockIndex
			}))
		});
		this.selectedMechanicBlockIndex.set(nextIndex);
	}

	protected isFirstMechanicBlock(index: number) {
		return index === 0;
	}

	protected isLastMechanicBlock(index: number) {
		return index === (this.draft()?.mechanicBlocks.length ?? 0) - 1;
	}

	protected mechanicBlockMechanic(block: SpellMechanicBlockDraft) {
		return this.findMechanic(block.mechanicId);
	}

	protected mechanicBlockParameters(block: SpellMechanicBlockDraft) {
		return this.mechanicBlockMechanic(block)?.parameters ?? [];
	}

	protected mechanicBlockTextPreview(block: SpellMechanicBlockDraft) {
		const mechanic = this.mechanicBlockMechanic(block);

		if (!mechanic) {
			return 'Механика не найдена.';
		}

		return renderMechanicTextTemplate(
			mechanic.textTemplate,
			mechanic,
			block.parameterValues,
			value => this.parameterValueLabel(value.kind, value.value)
		);
	}

	protected parameterValue(block: SpellMechanicBlockDraft, parameterId: string) {
		return block.parameterValues[parameterId] ?? '';
	}

	protected parameterOptions(parameter: SpellMechanicParameter): SelectOptionGroup[] {
		switch (parameter.kind) {
			case 'target':
				return createSingleOptionGroup(
					'Цели заклинания',
					(this.draft()?.targetConfigs ?? [])
						.sort(compareByOrderAndName)
						.map(toSelectOption)
				);
			case 'skill':
				return createSkillOptionGroups(this.skillCategories(), this.skills());
			case 'damageType':
				return createSingleOptionGroup(
					'Типы урона',
					this.damageTypes()
						.filter(item => item.isActive)
						.sort(compareByOrderAndName)
						.map(toSelectOption)
				);
			case 'condition':
				return createSingleOptionGroup(
					'Состояния',
					this.conditions()
						.filter(item => item.isActive)
						.sort(compareByOrderAndName)
						.map(toSelectOption)
				);
			default:
				return [];
		}
	}

	protected usesParameterSelect(kind: SpellMechanicParameterKind) {
		return (
			kind === 'target' ||
			kind === 'skill' ||
			kind === 'damageType' ||
			kind === 'condition'
		);
	}

	protected parameterKindLabel(kind: SpellMechanicParameterKind) {
		switch (kind) {
			case 'target':
				return 'Цель';
			case 'skill':
				return 'Навык';
			case 'number':
				return 'Число';
			case 'formula':
				return 'Формула';
			case 'damageType':
				return 'Тип урона';
			case 'condition':
				return 'Состояние';
			case 'systemValue':
				return 'Значение';
			case 'text':
				return 'Текст';
		}
	}

	protected resetDraft() {
		this.loadSpell();
	}

	protected saveDraft() {
		const draft = this.draft();

		if (!draft || !this.hasChanges() || this.saving()) {
			return;
		}

		const name = draft.name.trim();

		if (!name) {
			this.errorMessage.set('Название заклинания обязательно.');
			return;
		}

		const command = {
			actionId: draft.actionId,
			essenceId: draft.essenceId,
			gestureId: draft.gestureId,
			name,
			description: draft.description.trim(),
			status: draft.status,
			isActive: draft.isActive,
			sortOrder: draft.sortOrder,
			mechanicBlocks: draft.mechanicBlocks.map((block, index) => ({
				id: block.id,
				mechanicId: block.mechanicId,
				parameterValues: block.parameterValues,
				isActive: block.isActive,
				sortOrder: index
			})),
			targetConfigs: draft.targetConfigs.map((target, index) => ({
				...target,
				sortOrder: index
			}))
		};
		const request = draft.id
			? this.repository.updateSpell(draft.id, command)
			: this.repository.createSpell(command);

		this.saving.set(true);
		this.errorMessage.set(null);
		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: saved => {
				this.setDraftFromSpell(saved);
				this.saving.set(false);

				if (!draft.id) {
					void this.router.navigate(['/admin/rules/spells', saved.id], {
						replaceUrl: true
					});
				}
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error ? error.message : 'Не удалось сохранить заклинание.'
				);
				this.saving.set(false);
			}
		});
	}

	protected deleteSpell() {
		const draft = this.draft();

		if (!draft?.id || this.saving()) {
			return;
		}

		this.confirmationService.confirm({
			header: 'Удалить заклинание?',
			message: `«${draft.name}» вернётся в состояние «Не заполнено».`,
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.deleteSpellInternal(draft.id as string)
		});
	}

	protected statusLabel(status: PersistedSpellStatus) {
		return spellStatusLabel(status);
	}

	protected statusSeverity(status: PersistedSpellStatus) {
		switch (status) {
			case 'READY':
				return 'success';
			case 'TESTING':
				return 'info';
			case 'DRAFT':
				return 'warn';
		}
	}

	protected canManageActivity(status: PersistedSpellStatus) {
		return canManageSpellActivity(status);
	}

	private loadSpell() {
		this.loading.set(true);
		this.errorMessage.set(null);

		forkJoin({
			spells: this.repository.loadSpellCatalog(),
			mechanics: this.spellMechanicsRepository.loadCatalog(),
			words: this.repository.loadCatalog(),
			skills: this.skillsRepository.loadAdminCatalog(),
			damageTypes: this.damageTypesRepository.loadCatalog(),
			conditions: this.conditionsRepository.loadCatalog()
		})
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: ({ spells, mechanics, words, skills, damageTypes, conditions }) => {
					this.spellMechanics.set(mechanics.mechanics);
					this.magicWords.set(words.words);
					this.skills.set(skills.skills);
					this.skillCategories.set(skills.categories);
					this.damageTypes.set(damageTypes.damageTypes);
					this.conditions.set(conditions.conditions);

					const formula = findFormulaFromRoute(spells, this.route);

					if (!formula) {
						this.errorMessage.set('Заклинание не найдено.');
						this.loading.set(false);
						return;
					}

					this.setDraftFromFormula(formula);
					this.loading.set(false);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить заклинание.'
					);
					this.loading.set(false);
				}
			});
	}

	private setDraftFromFormula(formula: SpellFormulaCandidate) {
		if (formula.spell) {
			this.setDraftFromSpell(formula.spell);
			return;
		}

		const draft: SpellDraft = {
			id: null,
			actionId: formula.action.id,
			essenceId: formula.essence.id,
			gestureId: formula.gesture.id,
			formulaName: `${formula.action.name} + ${formula.essence.name} + ${formula.gesture.name}`,
			name: `${formula.action.name} ${formula.essence.name}: ${formula.gesture.name}`,
			description: '',
			status: 'DRAFT',
			isActive: false,
			sortOrder: 0,
			targetConfigs: createDefaultTargetConfigs(),
			mechanicBlocks: []
		};

		this.draft.set(draft);
		this.selectedTargetConfigIndex.set(0);
		this.selectedMechanicBlockIndex.set(null);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private setDraftFromSpell(spell: Spell) {
		const draft: SpellDraft = {
			id: spell.id,
			actionId: spell.actionId,
			essenceId: spell.essenceId,
			gestureId: spell.gestureId,
			formulaName: spell.formulaName,
			name: spell.name,
			description: spell.description,
			status: spell.status,
			isActive: spell.isActive,
			sortOrder: spell.sortOrder,
			targetConfigs: normalizeTargetConfigs(spell.targetConfigs),
			mechanicBlocks: spell.mechanicBlocks
				.sort((first, second) => first.sortOrder - second.sortOrder)
				.map(block => ({
					id: block.id,
					mechanicId: block.mechanicId,
					parameterValues: stringifyParameterValues(block.parameterValues),
					isActive: block.isActive,
					sortOrder: block.sortOrder
				}))
		};

		this.draft.set(draft);
		this.selectedTargetConfigIndex.set(
			draft.targetConfigs.length ? 0 : null
		);
		this.selectedMechanicBlockIndex.set(
			draft.mechanicBlocks.length ? 0 : null
		);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private patchDraft(patch: Partial<SpellDraft>) {
		this.draft.update(draft => (draft ? { ...draft, ...patch } : draft));
	}

	private updateMechanicBlock(
		index: number,
		block: SpellMechanicBlockDraft
	) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			mechanicBlocks: draft.mechanicBlocks.map((item, blockIndex) =>
				blockIndex === index ? block : item
			)
		});
	}

	private findMechanic(mechanicId: string) {
		return this.spellMechanics().find(mechanic => mechanic.id === mechanicId) ?? null;
	}

	private essenceMagicWord() {
		const essenceId = this.draft()?.essenceId;
		return (
			this.magicWords().find(word => word.id === essenceId && word.type === 'ESSENCE') ??
			null
		);
	}

	private parameterValueLabel(
		kind: SpellMechanicParameterKind,
		value: string
	) {
		if (!value) {
			return 'Не выбрано';
		}

		switch (kind) {
			case 'skill':
				return this.skills().find(item => item.id === value)?.name ?? value;
			case 'target':
				return this.draft()?.targetConfigs.find(item => item.id === value)?.name ?? value;
			case 'damageType':
				return this.damageTypes().find(item => item.id === value)?.name ?? value;
			case 'condition':
				return this.conditions().find(item => item.id === value)?.name ?? value;
			default:
				return value;
		}
	}

	private deleteSpellInternal(id: string) {
		this.saving.set(true);
		this.errorMessage.set(null);
		this.repository
			.deleteSpell(id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.saving.set(false);
					void this.router.navigate(['/admin/rules/spells']);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error ? error.message : 'Не удалось удалить заклинание.'
					);
					this.saving.set(false);
				}
			});
	}
}

function findFormulaFromRoute(
	catalog: SpellCatalog,
	route: ActivatedRoute
): SpellFormulaCandidate | null {
	const spellId = route.snapshot.paramMap.get('spellId');
	const actionId = route.snapshot.paramMap.get('actionId');
	const essenceId = route.snapshot.paramMap.get('essenceId');
	const gestureId = route.snapshot.paramMap.get('gestureId');

	for (const group of catalog.groups) {
		for (const formula of group.formulas) {
			if (spellId && formula.spell?.id === spellId) {
				return formula;
			}

			if (
				actionId &&
				essenceId &&
				gestureId &&
				formula.action.id === actionId &&
				formula.essence.id === essenceId &&
				formula.gesture.id === gestureId
			) {
				return formula;
			}
		}
	}

	return null;
}

function createMechanicBlockDraft(
	mechanic: SpellMechanic,
	sortOrder: number,
	essence: MagicWord | null,
	targetIdsByParameterId: Record<string, string>,
	id: string = crypto.randomUUID()
): SpellMechanicBlockDraft {
	return {
		id,
		mechanicId: mechanic.id,
		parameterValues: Object.fromEntries(
			mechanic.parameters.map(parameter => [
				parameter.id,
				defaultParameterValue(parameter, essence, targetIdsByParameterId)
			])
		),
		isActive: true,
		sortOrder
	};
}

function createMechanicBlockPatch(
	draft: SpellDraft,
	mechanic: SpellMechanic,
	essence: MagicWord | null,
	blockId: string = crypto.randomUUID(),
	insertIndex: number = draft.mechanicBlocks.length
): Pick<SpellDraft, 'mechanicBlocks' | 'targetConfigs'> {
	const createdTargets = mechanic.parameters
		.filter(parameter => parameter.kind === 'target' && parameter.defaultTargetConfig)
		.map((parameter, index) => ({
			parameterId: parameter.id,
			target: createTargetConfigFromMechanicDefault(
				parameter.defaultTargetConfig as NonNullable<typeof parameter.defaultTargetConfig>,
				draft.targetConfigs.length + index
			)
		}));
	const targetIdsByParameterId = Object.fromEntries(
		createdTargets.map(item => [item.parameterId, item.target.id])
	);
	const block = createMechanicBlockDraft(
		mechanic,
		insertIndex,
		essence,
		targetIdsByParameterId,
		blockId
	);
	const nextBlocks = [...draft.mechanicBlocks];
	nextBlocks.splice(insertIndex, 0, block);

	return {
		targetConfigs: [
			...draft.targetConfigs,
			...createdTargets.map(item => item.target)
		].map((target, index) => ({ ...target, sortOrder: index })),
		mechanicBlocks: nextBlocks.map((item, index) => ({
			...item,
			sortOrder: index
		}))
	};
}

function createTargetConfigFromMechanicDefault(
	defaultTarget: NonNullable<SpellMechanicParameter['defaultTargetConfig']>,
	sortOrder: number
): SpellTargetConfig {
	return {
		id: crypto.randomUUID(),
		name: defaultTarget.name,
		source: defaultTarget.source,
		relation: defaultTarget.relation,
		countMode: defaultTarget.countMode,
		countValueMode: defaultTarget.countValueMode,
		countValue: defaultTarget.countValue,
		countFormula: defaultTarget.countFormula,
		isRequired: defaultTarget.isRequired,
		sortOrder
	};
}

function createDefaultTargetConfigs(): SpellTargetConfig[] {
	return [
		{
			id: crypto.randomUUID(),
			name: 'Цель',
			source: 'selected',
			relation: 'any',
			countMode: 'one',
			countValueMode: 'fixed',
			countValue: 1,
			countFormula: '',
			isRequired: true,
			sortOrder: 0
		},
		{
			id: crypto.randomUUID(),
			name: 'Кастер',
			source: 'caster',
			relation: 'self',
			countMode: 'one',
			countValueMode: 'fixed',
			countValue: 1,
			countFormula: '',
			isRequired: true,
			sortOrder: 1
		}
	];
}

function createTargetConfigDraft(sortOrder: number): SpellTargetConfig {
	return {
		id: crypto.randomUUID(),
		name: `Цель ${sortOrder + 1}`,
		source: 'selected',
		relation: 'any',
		countMode: 'one',
		countValueMode: 'fixed',
		countValue: 1,
		countFormula: '',
		isRequired: true,
		sortOrder
	};
}

function normalizeTargetConfigs(targets: SpellTargetConfig[]): SpellTargetConfig[] {
	return targets
		.sort(compareByOrderAndName)
		.map((target, index) => ({
			id: target.id || crypto.randomUUID(),
			name: target.name || `Цель ${index + 1}`,
			source: target.source,
			relation: target.relation,
			countMode: target.countMode,
			countValueMode: target.countValueMode,
			countValue: target.countValue,
			countFormula: target.countFormula,
			isRequired: target.isRequired,
			sortOrder: index
		}));
}

function optionLabel<T extends string>(
	options: Array<{ label: string; value: T }>,
	value: T
) {
	return options.find(option => option.value === value)?.label ?? value;
}

function targetCountLabel(target: SpellTargetConfig) {
	if (target.countMode === 'one') {
		return 'одна цель';
	}

	if (target.countMode === 'all') {
		return 'все цели';
	}

	const value =
		target.countValueMode === 'formula'
			? target.countFormula || 'формула'
			: String(target.countValue);

	return target.countMode === 'upTo' ? `до ${value}` : `ровно ${value}`;
}

function defaultParameterValue(
	parameter: SpellMechanicParameter,
	essence: MagicWord | null,
	targetIdsByParameterId: Record<string, string>
) {
	if (parameter.kind === 'target') {
		return targetIdsByParameterId[parameter.id] ?? '';
	}

	if (parameter.defaultValue.mode === 'static') {
		return parameter.defaultValue.value;
	}

	if (parameter.defaultValue.mode !== 'fromMagicWord' || !essence) {
		return '';
	}

	switch (parameter.kind) {
		case 'skill':
			return essence.skillIds[0] ?? '';
		case 'damageType':
			return essence.damageTypeIds[0] ?? '';
		case 'condition':
			return essence.conditionIds[0] ?? '';
		default:
			return '';
	}
}

function stringifyParameterValues(values: Record<string, unknown>) {
	return Object.fromEntries(
		Object.entries(values).map(([key, value]) => [key, String(value ?? '')])
	);
}

function createSkillOptionGroups(
	categories: SkillCategory[],
	skills: Skill[]
): SelectOptionGroup[] {
	return categories
		.filter(category => category.isActive)
		.sort(compareByOrderAndName)
		.map(category => ({
			label: category.name,
			items: skills
				.filter(skill => skill.isActive && skill.categoryId === category.id)
				.sort(compareByOrderAndName)
				.map(toSelectOption)
		}))
		.filter(group => group.items.length);
}

function createSingleOptionGroup(
	label: string,
	items: SelectOption[]
): SelectOptionGroup[] {
	return items.length ? [{ label, items }] : [];
}

function toSelectOption(item: { id: string; name: string }) {
	return {
		id: item.id,
		name: item.name,
		searchText: item.name.toLowerCase()
	};
}

function compareByOrderAndName<T extends { sortOrder?: number; name: string }>(
	first: T,
	second: T
) {
	const orderDiff = (first.sortOrder ?? 0) - (second.sortOrder ?? 0);
	return orderDiff || first.name.localeCompare(second.name, 'ru');
}

function renderMechanicTextTemplate(
	template: string,
	mechanic: SpellMechanic,
	values: Record<string, string>,
	formatValue: (value: { kind: SpellMechanicParameterKind; value: string }) => string
) {
	const document = parseMechanicTextTemplate(template);

	return document
		.map(segment => {
			if (segment.kind === 'text') {
				return segment.text;
			}

			if (segment.kind === 'parameter') {
				const parameter = mechanic.parameters.find(
					item => item.id === segment.parameterId
				);

				if (!parameter) {
					return '[Параметр не найден]';
				}

				return formatValue({
					kind: parameter.kind,
					value: values[parameter.id] ?? parameter.defaultValue.value
				});
			}

			return `[${segment.resultName}]`;
		})
		.join('');
}

type MechanicTextTemplateSegment =
	| { kind: 'text'; text: string }
	| { kind: 'parameter'; parameterId: string }
	| { kind: 'actionResult'; actionId: string; resultName: string };

function parseMechanicTextTemplate(template: string): MechanicTextTemplateSegment[] {
	if (!template.trim()) {
		return [];
	}

	try {
		const parsed: unknown = JSON.parse(template);

		if (
			isRecord(parsed) &&
			parsed['version'] === 1 &&
			Array.isArray(parsed['segments'])
		) {
			return parsed['segments'].filter(isMechanicTextTemplateSegment);
		}
	} catch {
		return [{ kind: 'text', text: template }];
	}

	return [{ kind: 'text', text: template }];
}

function isMechanicTextTemplateSegment(
	value: unknown
): value is MechanicTextTemplateSegment {
	if (!isRecord(value)) {
		return false;
	}

	if (value['kind'] === 'text') {
		return typeof value['text'] === 'string';
	}

	if (value['kind'] === 'parameter') {
		return typeof value['parameterId'] === 'string';
	}

	return (
		value['kind'] === 'actionResult' &&
		typeof value['actionId'] === 'string' &&
		typeof value['resultName'] === 'string'
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function draftSignature(draft: SpellDraft | null): string {
	return JSON.stringify(draft ?? null);
}
