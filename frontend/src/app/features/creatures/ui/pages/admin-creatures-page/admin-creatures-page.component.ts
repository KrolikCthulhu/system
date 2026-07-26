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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmationService } from 'primeng/api';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { CREATURES_REPOSITORY } from '../../../data/creatures-repository.port';
import { CreatureAnatomyEditorComponent } from '../../components/creature-anatomy-editor/creature-anatomy-editor.component';
import { CreatureBaseActionsEditorComponent } from '../../components/creature-base-actions-editor/creature-base-actions-editor.component';
import { CreatureMainEditorComponent } from '../../components/creature-main-editor/creature-main-editor.component';
import { CreatureNaturalAttacksEditorComponent } from '../../components/creature-natural-attacks-editor/creature-natural-attacks-editor.component';
import { CreatureTiersEditorComponent } from '../../components/creature-tiers-editor/creature-tiers-editor.component';
import {
	Creature,
	CreatureAnatomySchemeOption,
	CreatureAnatomyZone,
	CreatureAnatomyZoneKind,
	CreatureArmorPresetOption,
	CreatureAttackAvailabilityRule,
	CreatureAttackFollowupAction,
	CreatureAttackProfileKind,
	CreatureCharacteristicOption,
	CreatureCombatIntentOption,
	CreatureConditionOption,
	CreatureDamageTypeOption,
	CreatureNaturalAttackOption,
	CreatureNaturalAttackProfile,
	CreatureSizeOption,
	CreatureSkillOptionGroup,
	CreatureSkillOption,
	CreatureTierAbility,
	CreatureTierAction,
	CreatureTierAttackOverride,
	CreatureTargetSelection,
	CreatureTargetSelectionScoringRule,
	CreatureTypeOption
} from '../../../domain/creatures.models';
import {
	ActivityFilter,
	CreatureAnatomyZoneOverrideField,
	CreatureAnatomyZoneViewGroup,
	CreatureAnatomyZoneViewItem,
	CreatureCombatIntentGroup,
	CreatureDraft,
	CreatureNaturalAttackDraft,
	CreatureNaturalAttackProfileDraft,
	CreatureNaturalAttackProfileIntentDraft,
	CreatureTierAttackProfileOption,
	CreatureTierCharacteristicDraft,
	CreatureTierDraft,
	CreatureTierSkillDraft,
	SelectOption
} from './admin-creature-editor.models';

const ANATOMY_ZONE_KIND_OPTIONS: SelectOption<CreatureAnatomyZoneKind>[] = [
	{ label: 'Основная зона', value: 'MAIN' },
	{ label: 'Прицельная подзона', value: 'TARGETED' }
];

const TARGET_SELECTION_RULE_OPTIONS: SelectOption<string>[] = [
	{ label: 'Добыча стаи', value: 'pack_prey' },
	{ label: 'Захвачена членом стаи', value: 'grabbed_by_pack' },
	{ label: 'Кровотечение', value: 'bleeding' },
	{ label: 'Лежит', value: 'prone' },
	{ label: 'Здоровье ниже половины', value: 'health_below_half' },
	{ label: 'Здоровье ниже четверти', value: 'health_below_quarter' },
	{ label: 'Тяжёлая травма', value: 'severe_injury' },
	{ label: 'Ближайшая доступная', value: 'nearest_available' },
	{ label: 'Цель, атакуемая стаей', value: 'attacked_by_pack' }
];

@Component({
	selector: 'app-admin-creatures-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Breadcrumb,
		Button,
		ConfirmDialog,
		IconField,
		InputIcon,
		InputText,
		Select,
		Tab,
		TabList,
		TabPanel,
		TabPanels,
		Tabs,
		TableModule,
		Tag,
		CreatureAnatomyEditorComponent,
		CreatureBaseActionsEditorComponent,
		CreatureMainEditorComponent,
		CreatureNaturalAttacksEditorComponent,
		CreatureTiersEditorComponent,
		EditorActionsBarComponent
	],
	templateUrl: './admin-creatures-page.component.html',
	styleUrl: './admin-creatures-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminCreaturesPageComponent {
	private readonly repository = inject(CREATURES_REPOSITORY);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Бестиарий' },
		{ label: 'Существа' }
	];
	protected readonly anatomyZoneKindOptions = ANATOMY_ZONE_KIND_OPTIONS;
	protected readonly selectedCreatureId = signal<string | null>(null);
	protected readonly searchQuery = signal('');
	protected readonly selectedTypeId = signal('');
	protected readonly selectedAnatomySchemeId = signal('');
	protected readonly selectedActivity = signal<ActivityFilter>('all');
	protected readonly creatures = signal<Creature[]>([]);
	protected readonly creatureTypes = signal<CreatureTypeOption[]>([]);
	protected readonly creatureSizes = signal<CreatureSizeOption[]>([]);
	protected readonly anatomySchemes = signal<CreatureAnatomySchemeOption[]>([]);
	protected readonly armorPresets = signal<CreatureArmorPresetOption[]>([]);
	protected readonly naturalAttacks = signal<CreatureNaturalAttackOption[]>([]);
	protected readonly combatIntents = signal<CreatureCombatIntentOption[]>([]);
	protected readonly damageTypes = signal<CreatureDamageTypeOption[]>([]);
	protected readonly conditions = signal<CreatureConditionOption[]>([]);
	protected readonly skills = signal<CreatureSkillOption[]>([]);
	protected readonly characteristics = signal<CreatureCharacteristicOption[]>(
		[]
	);
	protected readonly draft = signal<CreatureDraft | null>(null);
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly detailTab = signal('main');
	protected readonly selectedTierTab = signal('1');
	protected readonly selectedTierSectionTab = signal('main');
	protected readonly isAnatomyExpanded = signal(false);
	protected readonly expandedTierKeys = signal<Set<number>>(new Set([1]));

	protected readonly hasChanges = computed(() => {
		const draft = this.draft();
		return draft ? draftSignature(draft) !== this.savedDraftSignature() : false;
	});
	protected readonly selectedCreature = computed(() => {
		const id = this.selectedCreatureId();
		return id ? (this.creatures().find(item => item.id === id) ?? null) : null;
	});
	protected readonly filteredCreatures = computed(() => {
		const query = this.searchQuery().trim().toLowerCase();
		const typeId = this.selectedTypeId();
		const anatomySchemeId = this.selectedAnatomySchemeId();
		const activity = this.selectedActivity();
		return this.creatures()
			.filter(item => {
				const haystack =
					`${item.name} ${item.type.name} ${item.anatomyScheme?.name ?? ''}`.toLowerCase();
				const matchesQuery = !query || haystack.includes(query);
				const matchesType = !typeId || item.typeId === typeId;
				const matchesAnatomy =
					!anatomySchemeId || item.anatomySchemeId === anatomySchemeId;
				const matchesActivity =
					activity === 'all' ||
					(activity === 'active' ? item.isActive : !item.isActive);
				return matchesQuery && matchesType && matchesAnatomy && matchesActivity;
			})
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			});
	});
	protected readonly title = computed(() => {
		const draft = this.draft();
		return draft?.id ? draft.name || 'Существо' : 'Новое существо';
	});
	protected readonly listTitle = computed(() => {
		const count = this.filteredCreatures().length;
		return count ? `Бестиарий · ${count}` : 'Бестиарий';
	});
	protected readonly typeFilterOptions = computed(() => [
		{ label: 'Все типы', value: '' },
		...this.creatureTypes().map(type => ({
			label: type.name,
			value: type.id
		}))
	]);
	protected readonly anatomyFilterOptions = computed(() => [
		{ label: 'Все схемы', value: '' },
		...this.anatomySchemes().map(scheme => ({
			label: scheme.name,
			value: scheme.id
		}))
	]);
	protected readonly activityFilterOptions: SelectOption<ActivityFilter>[] = [
		{ label: 'Все', value: 'all' },
		{ label: 'Активные', value: 'active' },
		{ label: 'Выключенные', value: 'inactive' }
	];
	protected readonly targetSelectionRuleOptions = TARGET_SELECTION_RULE_OPTIONS;
	protected readonly skillOptionGroups = computed(() =>
		createSkillOptionGroups(this.skills())
	);
	protected readonly skillsById = computed(
		() => new Map(this.skills().map(skill => [skill.id, skill]))
	);
	protected readonly characteristicsById = computed(
		() =>
			new Map(
				this.characteristics().map(characteristic => [
					characteristic.id,
					characteristic
				])
			)
	);
	protected readonly creatureSizesById = computed(
		() => new Map(this.creatureSizes().map(size => [size.id, size]))
	);
	protected readonly armorPresetsById = computed(
		() => new Map(this.armorPresets().map(armor => [armor.id, armor]))
	);
	protected readonly combatIntentGroups = computed<CreatureCombatIntentGroup[]>(
		() => createCombatIntentGroups(this.combatIntents())
	);
	protected readonly anatomyZoneGroups = computed<
		CreatureAnatomyZoneViewGroup[]
	>(() => buildCreatureAnatomyZoneGroups(this.draft()?.anatomyZones ?? []));
	protected readonly anatomyParentOptionsByZoneId = computed(() => {
		const optionsByZoneId = new Map<string, SelectOption<string>[]>();

		for (const zone of this.draft()?.anatomyZones ?? []) {
			optionsByZoneId.set(zone.id, this.anatomyParentOptions(zone.id));
		}

		return optionsByZoneId;
	});
	protected readonly tierAttackProfileOptions = computed(() =>
		createTierAttackProfileOptions(this.draft(), this.naturalAttacks())
	);
	protected readonly tierSkillOptionsByKey = computed(() =>
		createTierSkillOptionsByKey(
			this.draft()?.tiers ?? [],
			this.skillOptionGroups()
		)
	);
	protected readonly effectiveTierActionsByTier = computed(() => {
		const draft = this.draft();
		const result = new Map<number, CreatureTierAction[]>();

		if (!draft) {
			return result;
		}

		for (const tier of draft.tiers) {
			result.set(
				tier.tier,
				mergeCreatureActions(draft.actions, tier.actionOverrides)
			);
		}

		return result;
	});
	protected readonly armorSummaryById = computed(() => {
		const summaries = new Map<string | null, string>();
		summaries.set(null, this.armorSummary(null));

		for (const armorPreset of this.armorPresets()) {
			summaries.set(armorPreset.id, this.armorSummary(armorPreset.id));
		}

		return summaries;
	});
	protected readonly sizeNameById = computed(() => {
		const sizes = new Map<string | null, string>();
		sizes.set(null, this.sizeName(null));

		for (const size of this.creatureSizes()) {
			sizes.set(size.id, this.sizeName(size.id));
		}

		return sizes;
	});

	constructor() {
		this.loadCatalog();
	}

	protected setSearchQuery(query: string) {
		this.searchQuery.set(query);
	}

	protected resetListFilters() {
		this.searchQuery.set('');
		this.selectedTypeId.set('');
		this.selectedAnatomySchemeId.set('');
		this.selectedActivity.set('all');
	}

	protected creatureAttackCount(creature: Creature): number {
		return creature.naturalAttacks.filter(attack => attack.isActive).length;
	}

	protected creatureActionCount(creature: Creature): number {
		return creature.actions.filter(action => action.isActive).length;
	}

	protected creatureTierCount(creature: Creature): number {
		return creature.tiers.filter(tier => tier.isActive).length;
	}

	protected selectCreature(creature: Creature) {
		if (creature.id === this.selectedCreatureId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => this.setDraftFromCreature(creature)
		});
	}

	protected closeCreatureDetail() {
		const close = () => {
			this.selectedCreatureId.set(null);
			this.draft.set(null);
			this.savedDraftSignature.set('');
			this.errorMessage.set(null);
		};

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: close,
			proceed: close
		});
	}

	protected createCreature() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				const draft = this.createEmptyDraft();
				this.selectedCreatureId.set(null);
				this.draft.set(draft);
				this.savedDraftSignature.set(draftSignature(draft));
				this.detailTab.set('main');
				this.selectedTierTab.set('1');
				this.selectedTierSectionTab.set('main');
			}
		});
	}

	protected setDetailTab(value: string | number | undefined) {
		if (value !== undefined) {
			this.detailTab.set(String(value));
		}
	}

	protected setSelectedTierTab(value: string | number | undefined) {
		if (value !== undefined) {
			this.selectedTierTab.set(String(value));
			this.selectedTierSectionTab.set('main');
		}
	}

	protected setSelectedTierSectionTab(value: string | number | undefined) {
		if (value !== undefined) {
			this.selectedTierSectionTab.set(String(value));
		}
	}

	protected tierTabValue(tier: number): string {
		return String(tier);
	}

	protected updateDraftName(name: string) {
		this.patchDraft({ name });
	}

	protected updateDraftType(typeId: string) {
		this.patchDraft({ typeId });
	}

	protected updateDraftAnatomyScheme(anatomySchemeId: string | null) {
		this.patchDraft({ anatomySchemeId, anatomyZones: [] });
	}

	protected updateNaturalAttack(naturalAttackId: string, isSelected: boolean) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			naturalAttacks: isSelected
				? [
						...draft.naturalAttacks,
						this.createNaturalAttackDraft(naturalAttackId)
					]
				: draft.naturalAttacks.filter(
						item => item.naturalAttackId !== naturalAttackId
					)
		});
	}

	protected naturalAttackDraft(naturalAttackId: string) {
		return (
			this.draft()?.naturalAttacks.find(
				item => item.naturalAttackId === naturalAttackId
			) ?? null
		);
	}

	protected profileKindLabel(kind: CreatureAttackProfileKind) {
		return kind === 'melee' ? 'Ближняя атака' : 'Дистанционная атака';
	}

	protected updateNaturalAttackProfile(
		naturalAttackId: string,
		profileIndex: number,
		patch: Partial<CreatureNaturalAttackProfileDraft>
	) {
		this.draft.update(draft =>
			draft
				? {
						...draft,
						naturalAttacks: draft.naturalAttacks.map(attack =>
							attack.naturalAttackId === naturalAttackId
								? {
										...attack,
										attackProfiles: attack.attackProfiles.map(
											(profile, index) =>
												index === profileIndex
													? { ...profile, ...patch }
													: profile
										)
									}
								: attack
						)
					}
				: draft
		);
	}

	protected updateNaturalAttackProfileDamageType(
		naturalAttackId: string,
		profileIndex: number,
		damageTypeId: string,
		checked: boolean
	) {
		const profile =
			this.naturalAttackDraft(naturalAttackId)?.attackProfiles[profileIndex];

		if (!profile) {
			return;
		}

		this.updateNaturalAttackProfile(naturalAttackId, profileIndex, {
			damageTypeIds: checked
				? [...profile.damageTypeIds, damageTypeId]
				: profile.damageTypeIds.filter(id => id !== damageTypeId)
		});
	}

	protected updateNaturalAttackProfileIntent(
		naturalAttackId: string,
		profileIndex: number,
		combatIntentId: string,
		checked: boolean
	) {
		const profile =
			this.naturalAttackDraft(naturalAttackId)?.attackProfiles[profileIndex];

		if (!profile) {
			return;
		}

		this.updateNaturalAttackProfile(naturalAttackId, profileIndex, {
			intents: checked
				? [
						...profile.intents,
						{
							combatIntentId,
							nameOverride: '',
							costModifier: 0,
							damageModifier: 0,
							ruleText: '',
							availabilityRules: [],
							sortOrder: profile.intents.length
						}
					]
				: profile.intents.filter(
						intent => intent.combatIntentId !== combatIntentId
					)
		});
	}

	protected hasNaturalAttackProfileIntent(
		profile: CreatureNaturalAttackProfileDraft,
		combatIntentId: string
	) {
		return profile.intents.some(
			intent => intent.combatIntentId === combatIntentId
		);
	}

	protected attackAvailabilityText(rules: CreatureAttackAvailabilityRule[]) {
		return rules
			.sort((first, second) => first.sortOrder - second.sortOrder)
			.map(rule => rule.unavailableText || rule.label)
			.join('; ');
	}

	protected toggleAnatomyExpanded() {
		this.isAnatomyExpanded.update(isExpanded => !isExpanded);
	}

	protected anatomyParentOptions(currentZoneId: string) {
		const zones = this.draft()?.anatomyZones ?? [];
		const excludedIds = collectCreatureAnatomyDescendantIds(
			zones,
			currentZoneId
		);
		excludedIds.add(currentZoneId);

		return zones
			.filter(zone => !zone.isRemoved && !excludedIds.has(zone.id))
			.map(zone => ({ label: zone.name || 'Зона', value: zone.id }));
	}

	protected updateAnatomyZone(
		index: number,
		patch: Partial<CreatureAnatomyZone>,
		overriddenField: CreatureAnatomyZoneOverrideField
	) {
		this.draft.update(draft =>
			draft
				? {
						...draft,
						anatomyZones: draft.anatomyZones.map((zone, zoneIndex) =>
							zoneIndex === index
								? {
										...zone,
										...patch,
										overriddenFields: addOverrideField(
											zone.overriddenFields,
											overriddenField
										)
									}
								: zone
						)
					}
				: draft
		);
	}

	protected updateDraftSortOrder(sortOrder: number | null) {
		this.patchDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected updateDraftActive(isActive: boolean) {
		this.patchDraft({ isActive });
	}

	protected updateTierName(tier: number, name: string) {
		this.patchTier(tier, { name });
	}

	protected updateTierHp(tier: number, hp: number | null) {
		this.patchTier(tier, { hp: hp ?? 1 });
	}

	protected updateTierSize(tier: number, sizeId: string | null) {
		this.patchTier(tier, { sizeId });
	}

	protected updateTierArmor(tier: number, armorPresetId: string | null) {
		this.patchTier(tier, { armorPresetId });
	}

	protected addTier() {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		const tierNumber = draft.tiers.length
			? Math.max(...draft.tiers.map(tier => tier.tier)) + 1
			: 1;
		const tierDraft = this.createTierDraft(tierNumber, null, draft.actions);

		this.draft.set({
			...draft,
			tiers: [...draft.tiers, tierDraft].sort(
				(first, second) => first.tier - second.tier
			)
		});
		this.selectedTierTab.set(String(tierNumber));
		this.selectedTierSectionTab.set('main');
	}

	protected removeTier(tier: number) {
		const draft = this.draft();

		if (!draft || draft.tiers.length <= 1) {
			return;
		}

		const nextTiers = draft.tiers.filter(item => item.tier !== tier);

		if (nextTiers.length === draft.tiers.length) {
			return;
		}

		this.draft.set({ ...draft, tiers: nextTiers });

		if (this.selectedTierTab() === String(tier)) {
			const nextSelectedTier =
				nextTiers.find(item => item.tier > tier) ??
				nextTiers[nextTiers.length - 1];
			this.selectedTierTab.set(String(nextSelectedTier.tier));
			this.selectedTierSectionTab.set('main');
		}
	}

	protected updateTierTargetSelection(
		tier: number,
		patch: Partial<CreatureTargetSelection>
	) {
		const current = this.draft()?.tiers.find(item => item.tier === tier);

		if (!current) {
			return;
		}

		this.patchTier(tier, {
			targetSelection: {
				...current.targetSelection,
				...patch
			}
		});
	}

	protected addTargetScoringRule(tier: number) {
		const current = this.draft()?.tiers.find(item => item.tier === tier);

		if (!current) {
			return;
		}

		const selectedKeys = new Set(
			current.targetSelection.scoringRules.map(rule => rule.key)
		);
		const option =
			this.targetSelectionRuleOptions.find(
				item => !selectedKeys.has(item.value)
			) ?? this.targetSelectionRuleOptions[0];

		this.updateTierTargetSelection(tier, {
			scoringRules: [
				...current.targetSelection.scoringRules,
				{
					key: option.value,
					label: option.label,
					points: 0,
					isActive: true,
					sortOrder: current.targetSelection.scoringRules.length
				}
			]
		});
	}

	protected updateTargetScoringRuleKey(
		tier: number,
		index: number,
		key: string | null
	) {
		const option = this.targetSelectionRuleOptions.find(
			item => item.value === key
		);

		if (!option) {
			return;
		}

		this.updateTargetScoringRule(tier, index, {
			key: option.value,
			label: option.label
		});
	}

	protected updateTargetScoringRule(
		tier: number,
		index: number,
		patch: Partial<CreatureTargetSelectionScoringRule>
	) {
		const current = this.draft()?.tiers.find(item => item.tier === tier);

		if (!current) {
			return;
		}

		this.updateTierTargetSelection(tier, {
			scoringRules: current.targetSelection.scoringRules.map(
				(rule, ruleIndex) =>
					ruleIndex === index ? { ...rule, ...patch } : rule
			)
		});
	}

	protected removeTargetScoringRule(tier: number, index: number) {
		const current = this.draft()?.tiers.find(item => item.tier === tier);

		if (!current) {
			return;
		}

		this.updateTierTargetSelection(tier, {
			scoringRules: current.targetSelection.scoringRules.filter(
				(_, ruleIndex) => ruleIndex !== index
			)
		});
	}

	protected updateBaseActions(actions: CreatureTierAction[]) {
		this.patchDraft({ actions });
	}

	protected effectiveTierActions(
		tier: CreatureTierDraft
	): CreatureTierAction[] {
		return this.effectiveTierActionsByTier().get(tier.tier) ?? [];
	}

	protected updateTierActionOverrides(
		tier: CreatureTierDraft,
		actions: CreatureTierAction[]
	) {
		const baseActions = this.draft()?.actions ?? [];
		this.patchTier(tier.tier, {
			actionOverrides: createTierActionOverrides(baseActions, actions)
		});
	}

	protected updateTierCharacteristic(
		tier: number,
		characteristicId: string,
		value: number | null
	) {
		this.patchTierCharacteristic(tier, characteristicId, value ?? 0);
	}

	protected isTierExpanded(tier: number): boolean {
		return this.expandedTierKeys().has(tier);
	}

	protected toggleTierExpanded(tier: number) {
		this.expandedTierKeys.update(keys => {
			const next = new Set(keys);

			if (next.has(tier)) {
				next.delete(tier);
				return next;
			}

			next.add(tier);
			return next;
		});
	}

	protected updateTierSkill(tier: number, index: number, skillId: string) {
		this.patchTierSkill(tier, index, { skillId });
	}

	protected updateTierSkillLevel(
		tier: number,
		index: number,
		level: number | null
	) {
		this.patchTierSkill(tier, index, { level: level ?? 1 });
	}

	protected addTierSkill(tier: number) {
		const skillId = this.firstAvailableSkillId(tier);

		if (!skillId) {
			return;
		}

		this.draft.update(draft =>
			draft
				? {
						...draft,
						tiers: draft.tiers.map(item =>
							item.tier === tier
								? {
										...item,
										skills: [...item.skills, { skillId, level: 1 }]
									}
								: item
						)
					}
				: draft
		);
	}

	protected removeTierSkill(tier: number, index: number) {
		this.draft.update(draft =>
			draft
				? {
						...draft,
						tiers: draft.tiers.map(item =>
							item.tier === tier
								? {
										...item,
										skills:
											item.skills.length > 1
												? item.skills.filter(
														(_, itemIndex) => itemIndex !== index
													)
												: item.skills
									}
								: item
						)
					}
				: draft
		);
	}

	protected skillOptionsForTier(
		tier: CreatureTierDraft,
		currentSkillId: string
	): CreatureSkillOptionGroup[] {
		return (
			this.tierSkillOptionsByKey().get(
				createTierSkillOptionsKey(tier.tier, currentSkillId)
			) ?? this.skillOptionGroups()
		);
	}

	protected resetDraft() {
		const creature = this.selectedCreature();

		if (creature) {
			this.setDraftFromCreature(creature);
			return;
		}

		const draft = this.createEmptyDraft();
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	protected saveDraft() {
		const draft = this.draft();

		if (!draft || !this.hasChanges() || this.saving()) {
			return;
		}

		const name = draft.name.trim();

		if (!name) {
			this.errorMessage.set('Название существа обязательно.');
			return;
		}

		if (!draft.typeId) {
			this.errorMessage.set('Тип существа обязателен.');
			return;
		}

		const invalidTier = draft.tiers.find(
			tier =>
				!tier.name.trim() ||
				tier.hp < 1 ||
				!tier.sizeId ||
				tier.characteristics.length === 0 ||
				tier.skills.length === 0 ||
				tier.skills.some(skill => !skill.skillId)
		);

		if (invalidTier) {
			this.errorMessage.set(
				'Для каждого тира нужны название, HP, размер и навыки.'
			);
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		const command = {
			name,
			typeId: draft.typeId,
			anatomySchemeId: draft.anatomySchemeId,
			anatomyZones: draft.anatomyZones.map((zone, sortOrder) => ({
				id: zone.id,
				sourceZoneId: zone.sourceZoneId,
				name: zone.name.trim(),
				slug: zone.slug,
				parentId: zone.parentId,
				kind: zone.kind,
				isRandomHitEligible: zone.isRandomHitEligible,
				randomHitWeight: zone.randomHitWeight,
				targetedAttackDicePenalty: zone.targetedAttackDicePenalty,
				extraPotentialCost: zone.extraPotentialCost,
				overriddenFields: zone.overriddenFields,
				isInherited: zone.isInherited,
				isRemoved: zone.isRemoved,
				isActive: zone.isActive,
				sortOrder
			})),
			naturalAttacks: draft.naturalAttacks.map((naturalAttack, sortOrder) => ({
				naturalAttackId: naturalAttack.naturalAttackId,
				attackProfiles: naturalAttack.attackProfiles.map(
					(profile, profileIndex) => ({
						kind: profile.kind,
						name: profile.name,
						skillId: profile.skillId,
						characteristicId: profile.characteristicId,
						baseCost: profile.baseCost,
						baseDamage: profile.baseDamage,
						rangeMeters: profile.rangeMeters,
						usesAmmo: profile.usesAmmo,
						canBeParried: profile.canBeParried,
						availabilityRules: profile.availabilityRules,
						damageTypeIds: profile.damageTypeIds,
						intents: profile.intents.map((intent, intentIndex) => ({
							...intent,
							sortOrder: intent.sortOrder ?? intentIndex
						})),
						followupActions: profile.followupActions,
						isActive: profile.isActive,
						sortOrder: profile.sortOrder ?? profileIndex
					})
				),
				isActive: naturalAttack.isActive,
				sortOrder: naturalAttack.sortOrder ?? sortOrder
			})),
			actions: draft.actions.map((action, actionIndex) => ({
				...action,
				sortOrder: action.sortOrder ?? actionIndex
			})),
			isActive: draft.isActive,
			sortOrder: draft.sortOrder,
			tiers: draft.tiers.map(tier => ({
				tier: tier.tier,
				name: tier.name.trim(),
				hp: tier.hp,
				sizeId: tier.sizeId,
				armorPresetId: tier.armorPresetId,
				attackOverrides: tier.attackOverrides.map(
					(override, overrideIndex) => ({
						...override,
						sortOrder: override.sortOrder ?? overrideIndex
					})
				),
				abilities: tier.abilities.map((ability, abilityIndex) => ({
					...ability,
					sortOrder: ability.sortOrder ?? abilityIndex
				})),
				actions: [],
				actionOverrides: tier.actionOverrides.map((action, actionIndex) => ({
					...action,
					sortOrder: action.sortOrder ?? actionIndex
				})),
				targetSelection: {
					title: '',
					description: '',
					tacticText: '',
					positionChecklist: [],
					scoringRules: [...tier.targetSelection.scoringRules]
						.sort((left, right) => right.points - left.points)
						.map((rule, ruleIndex) => ({
							...rule,
							label:
								this.targetSelectionRuleOptions.find(
									option => option.value === rule.key
								)?.label ?? rule.label,
							sortOrder: ruleIndex
						}))
				},
				characteristics: tier.characteristics.map(characteristic => ({
					characteristicId: characteristic.characteristicId,
					value: characteristic.value
				})),
				skills: tier.skills.map(skill => ({
					skillId: skill.skillId,
					level: skill.level
				})),
				isActive: tier.isActive,
				sortOrder: tier.sortOrder
			}))
		};
		const request = draft.id
			? this.repository.updateCreature(draft.id, command)
			: this.repository.createCreature(command);

		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: saved => {
				this.upsertCreature(saved);
				this.setDraftFromCreature(saved);
				this.saving.set(false);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error
						? error.message
						: 'Не удалось сохранить существо.'
				);
				this.saving.set(false);
			}
		});
	}

	protected deleteSelectedCreature() {
		const draft = this.draft();

		if (!draft?.id || this.saving()) {
			return;
		}

		this.confirmationService.confirm({
			header: 'Удалить существо?',
			message: `«${draft.name}» будет удалено из бестиария.`,
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.deleteCreature(draft.id as string)
		});
	}

	protected armorSummary(armorPresetId: string | null): string {
		const armor = armorPresetId
			? this.armorPresetsById().get(armorPresetId)
			: null;
		return armor ? `${armor.points} x ${armor.protection}` : 'нет';
	}

	protected sizeName(sizeId: string | null): string {
		return sizeId
			? (this.creatureSizesById().get(sizeId)?.name ?? 'размер')
			: 'размер';
	}

	protected tierAttackOverrideProfileKey(
		override: CreatureTierAttackOverride
	): string {
		return createTierAttackProfileKey(
			override.naturalAttack.slug,
			override.profileKind,
			override.profileName
		);
	}

	protected addTierAttackOverride(tier: number) {
		const option = this.tierAttackProfileOptions()[0];

		if (!option) {
			return;
		}

		this.draft.update(draft =>
			draft
				? {
						...draft,
						tiers: draft.tiers.map(item =>
							item.tier === tier
								? {
										...item,
										attackOverrides: [
											...item.attackOverrides,
											{
												naturalAttack: option.naturalAttack,
												profileKind: option.profileKind,
												profileName: option.profileName,
												isAvailable: true,
												costModifier: 0,
												damageModifier: 0,
												rangeModifier: 0,
												dicePoolModifier: 0,
												sortOrder: item.attackOverrides.length
											}
										]
									}
								: item
						)
					}
				: draft
		);
	}

	protected updateTierAttackOverrideProfile(
		tier: number,
		index: number,
		value: string
	) {
		const option = this.tierAttackProfileOptions().find(
			item => item.value === value
		);

		if (!option) {
			return;
		}

		this.patchTierAttackOverride(tier, index, {
			naturalAttack: option.naturalAttack,
			profileKind: option.profileKind,
			profileName: option.profileName
		});
	}

	protected updateTierAttackOverride(
		tier: number,
		index: number,
		patch: Partial<CreatureTierAttackOverride>
	) {
		this.patchTierAttackOverride(tier, index, patch);
	}

	protected removeTierAttackOverride(tier: number, index: number) {
		this.draft.update(draft =>
			draft
				? {
						...draft,
						tiers: draft.tiers.map(item =>
							item.tier === tier
								? {
										...item,
										attackOverrides: item.attackOverrides
											.filter((_, itemIndex) => itemIndex !== index)
											.map((override, overrideIndex) => ({
												...override,
												sortOrder: overrideIndex
											}))
									}
								: item
						)
					}
				: draft
		);
	}

	protected skillName(skillId: string): string {
		return this.skillsById().get(skillId)?.name ?? 'Навык';
	}

	private loadCatalog() {
		this.loading.set(true);
		this.errorMessage.set(null);

		this.repository
			.loadCatalog()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => {
					this.creatures.set(catalog.creatures);
					this.creatureTypes.set(catalog.creatureTypes);
					this.creatureSizes.set(catalog.creatureSizes);
					this.anatomySchemes.set(catalog.anatomySchemes);
					this.armorPresets.set(catalog.armorPresets);
					this.naturalAttacks.set(catalog.naturalAttacks);
					this.combatIntents.set(catalog.combatIntents);
					this.damageTypes.set(catalog.damageTypes);
					this.conditions.set(catalog.conditions);
					this.skills.set(catalog.skills);
					this.characteristics.set(catalog.characteristics);
					this.loading.set(false);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить существ.'
					);
					this.loading.set(false);
				}
			});
	}

	private setDraftFromCreature(creature: Creature) {
		const baseActions = creature.actions.length
			? creature.actions
			: (creature.tiers.find(item => item.actions.length)?.actions ?? []);
		const draft: CreatureDraft = {
			id: creature.id,
			name: creature.name,
			typeId: creature.typeId,
			anatomySchemeId: creature.anatomySchemeId,
			anatomyZones: creature.anatomyZones,
			naturalAttacks: creature.naturalAttacks
				.filter(item => item.isActive)
				.map((item, index) => ({
					naturalAttackId: item.naturalAttackId,
					attackProfiles: item.attackProfiles.map(profile =>
						this.toNaturalAttackProfileDraft(profile)
					),
					isActive: item.isActive,
					sortOrder: item.sortOrder ?? index
				})),
			actions: [...baseActions],
			tiers: (creature.tiers.length ? creature.tiers : [null])
				.map((tier, index) =>
					this.createTierDraft(tier?.tier ?? index + 1, tier, baseActions)
				)
				.sort((first, second) => first.tier - second.tier),
			isActive: creature.isActive,
			sortOrder: creature.sortOrder
		};

		this.selectedCreatureId.set(creature.id);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
		this.detailTab.set('main');
		this.selectedTierTab.set(String(draft.tiers[0]?.tier ?? 1));
		this.selectedTierSectionTab.set('main');
	}

	private createEmptyDraft(): CreatureDraft {
		return {
			id: null,
			name: '',
			typeId: this.creatureTypes()[0]?.id ?? '',
			anatomySchemeId: null,
			anatomyZones: [],
			naturalAttacks: [],
			actions: [],
			tiers: [this.createTierDraft(1, null, [])],
			isActive: true,
			sortOrder: 0
		};
	}

	private createTierDraft(
		tierNumber: number,
		tier: Creature['tiers'][number] | null,
		baseActions: CreatureTierAction[]
	): CreatureTierDraft {
		const actionOverrides = tier?.actionOverrides.length
			? tier.actionOverrides
			: createTierActionOverrides(baseActions, tier?.actions ?? []);

		return {
			tier: tierNumber,
			name: tier?.name ?? `Тир ${tierNumber}`,
			hp: tier?.hp ?? 1,
			sizeId: tier?.sizeId ?? this.defaultCreatureSizeId(),
			armorPresetId: tier?.armorPresetId ?? this.defaultArmorPresetId(),
			attackOverrides: [...(tier?.attackOverrides ?? [])],
			abilities: [...(tier?.abilities ?? [])],
			actions: [...(tier?.actions ?? [])],
			actionOverrides,
			targetSelection: createTargetSelectionDraft(tier?.targetSelection),
			characteristics: this.createTierCharacteristicDrafts(tier),
			skills: tier?.skills.length
				? tier.skills.map(skill => ({
						skillId: skill.skillId,
						level: skill.level
					}))
				: [{ skillId: this.defaultSkillId(), level: 1 }],
			isActive: tier?.isActive ?? true,
			sortOrder: tier?.sortOrder ?? tierNumber
		};
	}

	private defaultArmorPresetId(): string | null {
		return (
			this.armorPresets().find(item => item.slug === 'bez-broni')?.id ??
			this.armorPresets()[0]?.id ??
			null
		);
	}

	private defaultCreatureSizeId(): string | null {
		return (
			this.creatureSizes().find(item => item.slug === 'sredniy')?.id ??
			this.creatureSizes()[0]?.id ??
			null
		);
	}

	private defaultSkillId(): string {
		return (
			this.skills().find(item => item.slug === 'uklonenie')?.id ??
			this.skills()[0]?.id ??
			''
		);
	}

	private patchDraft(patch: Partial<CreatureDraft>) {
		this.draft.update(draft => (draft ? { ...draft, ...patch } : draft));
	}

	private patchTier(tier: number, patch: Partial<CreatureTierDraft>) {
		this.draft.update(draft =>
			draft
				? {
						...draft,
						tiers: draft.tiers.map(item =>
							item.tier === tier ? { ...item, ...patch } : item
						)
					}
				: draft
		);
	}

	private patchTierSkill(
		tier: number,
		index: number,
		patch: Partial<CreatureTierSkillDraft>
	) {
		this.draft.update(draft =>
			draft
				? {
						...draft,
						tiers: draft.tiers.map(item =>
							item.tier === tier
								? {
										...item,
										skills: item.skills.map((skill, skillIndex) =>
											skillIndex === index ? { ...skill, ...patch } : skill
										)
									}
								: item
						)
					}
				: draft
		);
	}

	private patchTierCharacteristic(
		tier: number,
		characteristicId: string,
		value: number
	) {
		this.draft.update(draft =>
			draft
				? {
						...draft,
						tiers: draft.tiers.map(item =>
							item.tier === tier
								? {
										...item,
										characteristics: item.characteristics.map(characteristic =>
											characteristic.characteristicId === characteristicId
												? { ...characteristic, value }
												: characteristic
										)
									}
								: item
						)
					}
				: draft
		);
	}

	private patchTierAttackOverride(
		tier: number,
		index: number,
		patch: Partial<CreatureTierAttackOverride>
	) {
		this.draft.update(draft =>
			draft
				? {
						...draft,
						tiers: draft.tiers.map(item =>
							item.tier === tier
								? {
										...item,
										attackOverrides: item.attackOverrides.map(
											(override, overrideIndex) =>
												overrideIndex === index
													? { ...override, ...patch }
													: override
										)
									}
								: item
						)
					}
				: draft
		);
	}

	private createTierCharacteristicDrafts(
		tier: Creature['tiers'][number] | null | undefined
	): CreatureTierCharacteristicDraft[] {
		return this.characteristics()
			.filter(characteristic => characteristic.isActive)
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			})
			.map(characteristic => {
				const value =
					tier?.characteristics.find(
						item => item.characteristicId === characteristic.id
					)?.value ?? defaultCreatureCharacteristicValue(characteristic);

				return {
					characteristicId: characteristic.id,
					value
				};
			});
	}

	private firstAvailableSkillId(tier: number): string {
		const draftTier = this.draft()?.tiers.find(item => item.tier === tier);
		const selectedSkillIds = new Set(
			draftTier?.skills.map(skill => skill.skillId) ?? []
		);
		return (
			this.skills().find(skill => !selectedSkillIds.has(skill.id))?.id ?? ''
		);
	}

	private createNaturalAttackDraft(
		naturalAttackId: string
	): CreatureNaturalAttackDraft {
		const naturalAttack = this.naturalAttacks().find(
			item => item.id === naturalAttackId
		);

		return {
			naturalAttackId,
			attackProfiles:
				naturalAttack?.attackProfiles.map(profile =>
					this.toNaturalAttackProfileDraft(profile)
				) ?? [],
			isActive: true,
			sortOrder: this.draft()?.naturalAttacks.length ?? 0
		};
	}

	private toNaturalAttackProfileDraft(
		profile: CreatureNaturalAttackProfile
	): CreatureNaturalAttackProfileDraft {
		return {
			kind: profile.kind,
			name: profile.name,
			skillId: profile.skillId,
			characteristicId: profile.characteristicId,
			baseCost: profile.baseCost,
			baseDamage: profile.baseDamage,
			rangeMeters: profile.rangeMeters,
			usesAmmo: profile.usesAmmo,
			canBeParried: profile.canBeParried,
			availabilityRules: [...(profile.availabilityRules ?? [])],
			damageTypeIds: [...profile.damageTypeIds],
			intents: profile.intents.map((intent, index) => ({
				combatIntentId: intent.combatIntentId,
				nameOverride: intent.nameOverride ?? '',
				costModifier: intent.costModifier ?? 0,
				damageModifier: intent.damageModifier ?? 0,
				ruleText: intent.ruleText ?? '',
				availabilityRules: [...(intent.availabilityRules ?? [])],
				sortOrder: intent.sortOrder ?? index
			})),
			followupActions: [...(profile.followupActions ?? [])],
			isActive: profile.isActive,
			sortOrder: profile.sortOrder
		};
	}

	private upsertCreature(creature: Creature) {
		this.creatures.update(items => {
			const index = items.findIndex(item => item.id === creature.id);

			if (index === -1) {
				return [...items, creature];
			}

			const next = [...items];
			next[index] = creature;
			return next;
		});
	}

	private deleteCreature(id: string) {
		this.saving.set(true);
		this.errorMessage.set(null);

		this.repository
			.deleteCreature(id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.creatures.update(items => items.filter(item => item.id !== id));
					this.saving.set(false);
					this.selectedCreatureId.set(null);
					this.draft.set(null);
					this.savedDraftSignature.set('');
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось удалить существо.'
					);
					this.saving.set(false);
				}
			});
	}
}

function defaultCreatureCharacteristicValue(
	characteristic: CreatureCharacteristicOption
): number {
	return Math.max(1, characteristic.defaultValue);
}

function draftSignature(draft: CreatureDraft | null): string {
	return JSON.stringify(draft ?? null);
}

function createTargetSelectionDraft(
	targetSelection: CreatureTargetSelection | null | undefined
): CreatureTargetSelection {
	return {
		title: targetSelection?.title ?? '',
		description: targetSelection?.description ?? '',
		tacticText: targetSelection?.tacticText ?? '',
		positionChecklist: [...(targetSelection?.positionChecklist ?? [])],
		scoringRules: [...(targetSelection?.scoringRules ?? [])]
			.sort((left, right) => right.points - left.points)
			.map((rule, ruleIndex) => ({
				key: rule.key,
				label: rule.label,
				points: rule.points,
				isActive: rule.isActive,
				sortOrder: rule.sortOrder ?? ruleIndex
			}))
	};
}

function createSkillOptionGroups(
	skills: CreatureSkillOption[]
): CreatureSkillOptionGroup[] {
	const groupsByCategoryId = new Map<string, CreatureSkillOptionGroup>();

	for (const skill of skills) {
		const label = skill.category.name;
		const group = groupsByCategoryId.get(skill.categoryId) ?? {
			label,
			items: []
		};

		group.items.push({
			...skill,
			searchText: `${skill.name} ${label}`
		});
		groupsByCategoryId.set(skill.categoryId, group);
	}

	return [...groupsByCategoryId.values()].map(group => ({
		label: group.label,
		items: group.items.sort((first, second) => {
			const orderDiff = first.sortOrder - second.sortOrder;
			return orderDiff || first.name.localeCompare(second.name, 'ru');
		})
	}));
}

function createTierAttackProfileOptions(
	draft: CreatureDraft | null,
	naturalAttacks: CreatureNaturalAttackOption[]
): CreatureTierAttackProfileOption[] {
	const naturalAttackOptionsById = new Map(
		naturalAttacks.map(attack => [attack.id, attack])
	);

	return (draft?.naturalAttacks ?? []).flatMap(naturalAttackDraft => {
		const naturalAttack = naturalAttackOptionsById.get(
			naturalAttackDraft.naturalAttackId
		);

		if (!naturalAttack) {
			return [];
		}

		return naturalAttackDraft.attackProfiles.map(profile => ({
			label: `${naturalAttack.name} · ${profile.name}`,
			value: createTierAttackProfileKey(
				naturalAttack.slug,
				profile.kind,
				profile.name
			),
			naturalAttack: {
				name: naturalAttack.name,
				slug: naturalAttack.slug
			},
			profileKind: profile.kind,
			profileName: profile.name
		}));
	});
}

function createTierSkillOptionsByKey(
	tiers: CreatureTierDraft[],
	groups: CreatureSkillOptionGroup[]
): Map<string, CreatureSkillOptionGroup[]> {
	const optionsByKey = new Map<string, CreatureSkillOptionGroup[]>();

	for (const tier of tiers) {
		for (const skill of tier.skills) {
			const selectedSkillIds = new Set(
				tier.skills
					.map(item => item.skillId)
					.filter(skillId => skillId !== skill.skillId)
			);

			optionsByKey.set(
				createTierSkillOptionsKey(tier.tier, skill.skillId),
				groups
					.map(group => ({
						label: group.label,
						items: group.items.filter(item => !selectedSkillIds.has(item.id))
					}))
					.filter(group => group.items.length > 0)
			);
		}
	}

	return optionsByKey;
}

function createTierSkillOptionsKey(tier: number, skillId: string): string {
	return `${tier}:${skillId}`;
}

function mergeCreatureActions(
	baseActions: CreatureTierAction[],
	actionOverrides: CreatureTierAction[]
): CreatureTierAction[] {
	const overridesBySlug = new Map(
		actionOverrides.map(action => [action.slug, action])
	);
	const inheritedActions = baseActions.map(action => ({
		...action,
		...(overridesBySlug.get(action.slug) ?? {})
	}));
	const inheritedSlugs = new Set(baseActions.map(action => action.slug));
	const localActions = actionOverrides.filter(
		action => !inheritedSlugs.has(action.slug)
	);

	return [...inheritedActions, ...localActions].sort(
		(first, second) => first.sortOrder - second.sortOrder
	);
}

function createTierActionOverrides(
	baseActions: CreatureTierAction[],
	effectiveActions: CreatureTierAction[]
): CreatureTierAction[] {
	const effectiveBySlug = new Map(
		effectiveActions.map(action => [action.slug, action])
	);
	const overrides: CreatureTierAction[] = [];

	for (const baseAction of baseActions) {
		const effectiveAction = effectiveBySlug.get(baseAction.slug);

		if (!effectiveAction) {
			overrides.push({ ...baseAction, isActive: false });
			continue;
		}

		if (!areCreatureActionsEqual(baseAction, effectiveAction)) {
			overrides.push(effectiveAction);
		}
	}

	const baseSlugs = new Set(baseActions.map(action => action.slug));
	overrides.push(
		...effectiveActions.filter(action => !baseSlugs.has(action.slug))
	);

	return overrides.sort((first, second) => first.sortOrder - second.sortOrder);
}

function areCreatureActionsEqual(
	first: CreatureTierAction,
	second: CreatureTierAction
): boolean {
	return JSON.stringify(first) === JSON.stringify(second);
}

function createCombatIntentGroups(
	intents: CreatureCombatIntentOption[]
): CreatureCombatIntentGroup[] {
	const groups = new Map<string, CreatureCombatIntentGroup>();

	for (const intent of intents) {
		const label = intent.category || 'Без категории';
		const group = groups.get(label) ?? {
			label,
			items: []
		};
		group.items.push(intent);
		groups.set(label, group);
	}

	return [...groups.values()].map(group => ({
		label: group.label,
		items: group.items.sort((first, second) => {
			const orderDiff = first.sortOrder - second.sortOrder;
			return orderDiff || first.name.localeCompare(second.name, 'ru');
		})
	}));
}

function buildCreatureAnatomyZoneGroups(
	zones: CreatureAnatomyZone[]
): CreatureAnatomyZoneViewGroup[] {
	const visibleZones = zones.filter(zone => !zone.isRemoved);
	const items = visibleZones.map(zone => ({
		zone,
		index: zones.findIndex(item => item.id === zone.id),
		children: [] as CreatureAnatomyZoneViewItem[]
	}));
	const itemsById = new Map(items.map(item => [item.zone.id, item]));
	const roots: CreatureAnatomyZoneViewItem[] = [];
	const orphanChildren: CreatureAnatomyZoneViewItem[] = [];

	for (const item of items) {
		const parent = item.zone.parentId
			? itemsById.get(item.zone.parentId)
			: undefined;

		if (parent) {
			parent.children.push(item);
			continue;
		}

		if (item.zone.parentId) {
			orphanChildren.push(item);
			continue;
		}

		roots.push(item);
	}

	const sortItems = (
		first: CreatureAnatomyZoneViewItem,
		second: CreatureAnatomyZoneViewItem
	) =>
		first.zone.sortOrder - second.zone.sortOrder ||
		first.zone.name.localeCompare(second.zone.name, 'ru');

	for (const item of items) {
		item.children.sort(sortItems);
	}

	const groups: CreatureAnatomyZoneViewGroup[] = roots
		.sort(sortItems)
		.map(item => ({
			trackId: item.zone.id,
			parent: item,
			children: item.children
		}));

	if (orphanChildren.length) {
		groups.push({
			trackId: 'orphan',
			parent: null,
			children: orphanChildren.sort(sortItems)
		});
	}

	return groups;
}

function collectCreatureAnatomyDescendantIds(
	zones: CreatureAnatomyZone[],
	zoneId: string
): Set<string> {
	const descendantIds = new Set<string>();
	let hasChanges = true;

	while (hasChanges) {
		hasChanges = false;

		for (const zone of zones) {
			if (
				zone.parentId &&
				(zone.parentId === zoneId || descendantIds.has(zone.parentId)) &&
				!descendantIds.has(zone.id)
			) {
				descendantIds.add(zone.id);
				hasChanges = true;
			}
		}
	}

	return descendantIds;
}

function addOverrideField(
	fields: string[],
	field: CreatureAnatomyZoneOverrideField
): string[] {
	return fields.includes(field) ? fields : [...fields, field];
}

function createTierAttackProfileKey(
	naturalAttackSlug: string,
	profileKind: CreatureAttackProfileKind | null,
	profileName: string
): string {
	return [naturalAttackSlug, profileKind ?? '', profileName].join('::');
}
