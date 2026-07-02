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
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { CREATURES_REPOSITORY } from '../../../data/creatures-repository.port';
import {
	Creature,
	CreatureArmorPresetOption,
	CreatureCharacteristicOption,
	CreatureSkillOptionGroup,
	CreatureSkillOption,
	CreatureTypeOption
} from '../../../domain/creatures.models';

interface CreatureTierDraft {
	tier: number;
	name: string;
	hp: number;
	armorPresetId: string | null;
	characteristics: CreatureTierCharacteristicDraft[];
	skills: CreatureTierSkillDraft[];
	isActive: boolean;
	sortOrder: number;
}

interface CreatureTierCharacteristicDraft {
	characteristicId: string;
	value: number;
}

interface CreatureTierSkillDraft {
	skillId: string;
	level: number;
}

interface CreatureDraft {
	id: string | null;
	name: string;
	typeId: string;
	tiers: CreatureTierDraft[];
	isActive: boolean;
	sortOrder: number;
}

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
		InputNumber,
		InputText,
		Select,
		Tag,
		ToggleSwitch,
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
	protected readonly selectedCreatureId = signal<string | null>(null);
	protected readonly searchQuery = signal('');
	protected readonly creatures = signal<Creature[]>([]);
	protected readonly creatureTypes = signal<CreatureTypeOption[]>([]);
	protected readonly armorPresets = signal<CreatureArmorPresetOption[]>([]);
	protected readonly skills = signal<CreatureSkillOption[]>([]);
	protected readonly characteristics = signal<CreatureCharacteristicOption[]>([]);
	protected readonly draft = signal<CreatureDraft | null>(null);
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly expandedTierKeys = signal<Set<number>>(new Set([1]));

	protected readonly hasChanges = computed(
		() => draftSignature(this.draft()) !== this.savedDraftSignature()
	);
	protected readonly selectedCreature = computed(() => {
		const id = this.selectedCreatureId();
		return id ? (this.creatures().find(item => item.id === id) ?? null) : null;
	});
	protected readonly filteredCreatures = computed(() => {
		const query = this.searchQuery().trim().toLowerCase();
		return this.creatures()
			.filter(item => {
				const haystack = `${item.name} ${item.type.name}`.toLowerCase();
				return !query || haystack.includes(query);
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
	protected readonly skillOptionGroups = computed(() =>
		createSkillOptionGroups(this.skills())
	);

	constructor() {
		this.loadCatalog();
	}

	protected setSearchQuery(query: string) {
		this.searchQuery.set(query);
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

	protected createCreature() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				const draft = this.createEmptyDraft();
				this.selectedCreatureId.set(null);
				this.draft.set(draft);
				this.savedDraftSignature.set(draftSignature(draft));
			}
		});
	}

	protected updateDraftName(name: string) {
		this.patchDraft({ name });
	}

	protected updateDraftType(typeId: string) {
		this.patchDraft({ typeId });
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

	protected updateTierArmor(tier: number, armorPresetId: string | null) {
		this.patchTier(tier, { armorPresetId });
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
		const selectedSkillIds = new Set(
			tier.skills
				.map(skill => skill.skillId)
				.filter(skillId => skillId !== currentSkillId)
		);
		return this.skillOptionGroups()
			.map(group => ({
				label: group.label,
				items: group.items.filter(skill => !selectedSkillIds.has(skill.id))
			}))
			.filter(group => group.items.length > 0);
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
				tier.characteristics.length === 0 ||
				tier.skills.length === 0 ||
				tier.skills.some(skill => !skill.skillId)
		);

		if (invalidTier) {
			this.errorMessage.set('Для каждого тира нужны название, HP и навыки.');
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		const command = {
			name,
			typeId: draft.typeId,
			isActive: draft.isActive,
			sortOrder: draft.sortOrder,
			tiers: draft.tiers.map(tier => ({
				tier: tier.tier,
				name: tier.name.trim(),
				hp: tier.hp,
				armorPresetId: tier.armorPresetId,
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
		const armor = this.armorPresets().find(item => item.id === armorPresetId);
		return armor ? `${armor.points} x ${armor.protection}` : 'нет';
	}

	protected skillName(skillId: string): string {
		return this.skills().find(skill => skill.id === skillId)?.name ?? 'Навык';
	}

	protected characteristic(characteristicId: string) {
		return (
			this.characteristics().find(item => item.id === characteristicId) ?? null
		);
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
					this.armorPresets.set(catalog.armorPresets);
					this.skills.set(catalog.skills);
					this.characteristics.set(catalog.characteristics);
					this.loading.set(false);
					this.selectFirstCreature();
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

	private selectFirstCreature() {
		const creature = [...this.creatures()].sort((first, second) => {
			const orderDiff = first.sortOrder - second.sortOrder;
			return orderDiff || first.name.localeCompare(second.name, 'ru');
		})[0];

		if (creature) {
			this.setDraftFromCreature(creature);
			return;
		}

		const draft = this.createEmptyDraft();
		this.selectedCreatureId.set(null);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private setDraftFromCreature(creature: Creature) {
		const evasionSkillId = this.defaultSkillId();
		const noArmorPresetId = this.defaultArmorPresetId();
		const draft: CreatureDraft = {
			id: creature.id,
			name: creature.name,
			typeId: creature.typeId,
			tiers: Array.from({ length: 5 }, (_, index) => {
				const tierNumber = index + 1;
				const tier = creature.tiers.find(item => item.tier === tierNumber);
				return {
					tier: tierNumber,
					name: tier?.name ?? `Тир ${tierNumber}`,
					hp: tier?.hp ?? 1,
					armorPresetId: tier?.armorPresetId ?? noArmorPresetId,
					characteristics: this.createTierCharacteristicDrafts(tier),
					skills: tier?.skills.length
						? tier.skills.map(skill => ({
								skillId: skill.skillId,
								level: skill.level
							}))
						: [{ skillId: evasionSkillId, level: 1 }],
					isActive: tier?.isActive ?? true,
					sortOrder: tier?.sortOrder ?? tierNumber
				};
			}),
			isActive: creature.isActive,
			sortOrder: creature.sortOrder
		};

		this.selectedCreatureId.set(creature.id);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private createEmptyDraft(): CreatureDraft {
		const noArmorPresetId = this.defaultArmorPresetId();
		const evasionSkillId = this.defaultSkillId();

		return {
			id: null,
			name: '',
			typeId: this.creatureTypes()[0]?.id ?? '',
			tiers: Array.from({ length: 5 }, (_, index) => {
				const tier = index + 1;
				return {
					tier,
					name: `Тир ${tier}`,
					hp: 1,
					armorPresetId: noArmorPresetId,
					characteristics: this.createTierCharacteristicDrafts(null),
					skills: [{ skillId: evasionSkillId, level: 1 }],
					isActive: true,
					sortOrder: tier
				};
			}),
			isActive: true,
			sortOrder: 0
		};
	}

	private defaultArmorPresetId(): string | null {
		return (
			this.armorPresets().find(item => item.slug === 'bez-broni')?.id ??
			this.armorPresets()[0]?.id ??
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
					this.selectFirstCreature();
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
