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
import { Checkbox } from 'primeng/checkbox';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Popover } from 'primeng/popover';
import { Select } from 'primeng/select';
import { Tag } from 'primeng/tag';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { NavigationTreeComponent } from '../../../../../shared/ui/navigation-tree/navigation-tree.component';
import { NavigationTreeGroup } from '../../../../../shared/ui/navigation-tree/navigation-tree.models';
import { WEAPONS_REPOSITORY } from '../../../data/weapons-repository.port';
import {
	Weapon,
	WeaponAttackProfile,
	WeaponAttackProfileKind,
	WeaponCharacteristicOption,
	WeaponCombatIntentOption,
	WeaponCombatIntentOptionGroup,
	WeaponDamageTypeOption,
	WeaponSkillOption,
	WeaponSkillOptionGroup,
	WeaponTemplate
} from '../../../domain/weapons.models';

interface WeaponAttackProfileDraft {
	id: string | null;
	kind: WeaponAttackProfileKind;
	name: string;
	skillId: string | null;
	characteristicId: string | null;
	baseCost: number;
	baseDamage: number;
	rangeMeters: number;
	usesAmmo: boolean;
	isActive: boolean;
	sortOrder: number;
	combatIntentIds: string[];
	damageTypeIds: string[];
}

interface WeaponDraft {
	id: string | null;
	name: string;
	templateId: string | null;
	isActive: boolean;
	sortOrder: number;
	attackProfiles: WeaponAttackProfileDraft[];
}

type ActiveFilter = 'active' | 'inactive';
type AttackKindFilter = WeaponAttackProfileKind;
type AmmoFilter = 'uses-ammo' | 'no-ammo';

@Component({
	selector: 'app-admin-weapons-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Breadcrumb,
		Button,
		Checkbox,
		ConfirmDialog,
		IconField,
		InputIcon,
		InputNumber,
		InputText,
		NavigationTreeComponent,
		Popover,
		Select,
		Tag,
		ToggleSwitch,
		EditorActionsBarComponent
	],
	templateUrl: './admin-weapons-page.component.html',
	styleUrl: './admin-weapons-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminWeaponsPageComponent {
	private readonly repository = inject(WEAPONS_REPOSITORY);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Оружие' }
	];
	protected readonly selectedWeaponId = signal<string | null>(null);
	protected readonly searchQuery = signal('');
	protected readonly selectedTemplateIdFilter = signal<string | null>(null);
	protected readonly selectedTemplateSkillIdFilter = signal<string | null>(null);
	protected readonly selectedProfileSkillIdFilter = signal<string | null>(null);
	protected readonly selectedAttackKindFilter = signal<AttackKindFilter | null>(null);
	protected readonly selectedActiveFilter = signal<ActiveFilter | null>(null);
	protected readonly selectedAmmoFilter = signal<AmmoFilter | null>(null);
	protected readonly collapsedGroups = signal<ReadonlySet<string>>(new Set());
	protected readonly collapsedSubgroups = signal<ReadonlySet<string>>(new Set());
	protected readonly weapons = signal<Weapon[]>([]);
	protected readonly templates = signal<WeaponTemplate[]>([]);
	protected readonly skills = signal<WeaponSkillOption[]>([]);
	protected readonly characteristics = signal<WeaponCharacteristicOption[]>([]);
	protected readonly combatIntents = signal<WeaponCombatIntentOption[]>([]);
	protected readonly damageTypes = signal<WeaponDamageTypeOption[]>([]);
	protected readonly draft = signal<WeaponDraft | null>(null);
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);

	protected readonly hasChanges = computed(
		() => draftSignature(this.draft()) !== this.savedDraftSignature()
	);
	protected readonly hasActiveFilters = computed(
		() =>
			Boolean(this.selectedTemplateIdFilter()) ||
			Boolean(this.selectedTemplateSkillIdFilter()) ||
			Boolean(this.selectedProfileSkillIdFilter()) ||
			Boolean(this.selectedAttackKindFilter()) ||
			Boolean(this.selectedActiveFilter()) ||
			Boolean(this.selectedAmmoFilter())
	);
	protected readonly selectedWeapon = computed(() => {
		const id = this.selectedWeaponId();
		return id ? (this.weapons().find(item => item.id === id) ?? null) : null;
	});
	protected readonly skillGroups = computed(() =>
		buildSkillGroups(this.skills().filter(skill => skill.isActive))
	);
	protected readonly combatIntentOptions = computed(() =>
		this.combatIntents().filter(intent => intent.isActive)
	);
	protected readonly combatIntentGroups = computed<WeaponCombatIntentOptionGroup[]>(() =>
		buildCombatIntentGroups(this.combatIntentOptions())
	);
	protected readonly damageTypeOptions = computed(() =>
		this.damageTypes().filter(damageType => damageType.isActive)
	);
	protected readonly templateOptions = computed(() =>
		this.templates().filter(template => template.isActive)
	);
	protected readonly templateById = computed(
		() => new Map(this.templates().map(template => [template.id, template]))
	);
	protected readonly templateSkillOptions = computed(() =>
		uniqueById(this.templateOptions().map(template => template.skill))
	);
	protected readonly profileSkillOptions = computed(() =>
		this.skills().filter(skill => skill.isActive)
	);
	protected readonly attackKindOptions = [
		{ label: 'Ближняя атака', value: 'melee' },
		{ label: 'Дистанционная атака', value: 'ranged' }
	] satisfies Array<{ label: string; value: AttackKindFilter }>;
	protected readonly activeFilterOptions = [
		{ label: 'Активные', value: 'active' },
		{ label: 'Выключенные', value: 'inactive' }
	] satisfies Array<{ label: string; value: ActiveFilter }>;
	protected readonly ammoFilterOptions = [
		{ label: 'Использует боеприпасы', value: 'uses-ammo' },
		{ label: 'Без боеприпасов', value: 'no-ammo' }
	] satisfies Array<{ label: string; value: AmmoFilter }>;
	protected readonly characteristicOptions = computed(() =>
		this.characteristics().filter(characteristic => characteristic.isActive)
	);
	protected readonly canAddMeleeProfile = computed(
		() => !this.draft()?.attackProfiles.some(profile => profile.kind === 'melee')
	);
	protected readonly canAddRangedProfile = computed(
		() => !this.draft()?.attackProfiles.some(profile => profile.kind === 'ranged')
	);
	protected readonly filteredWeapons = computed(() => {
		const query = this.searchQuery().trim().toLowerCase();
		const templateId = this.selectedTemplateIdFilter();
		const templateSkillId = this.selectedTemplateSkillIdFilter();
		const profileSkillId = this.selectedProfileSkillIdFilter();
		const attackKind = this.selectedAttackKindFilter();
		const activeFilter = this.selectedActiveFilter();
		const ammoFilter = this.selectedAmmoFilter();
		const templates = this.templateById();

		return this.weapons()
			.filter(item => {
				const template = templates.get(item.templateId);
				const haystack = `${item.name} ${item.attackProfiles
					.map(profile => `${profile.name} ${profile.skill.name} ${profile.rangeMeters}`)
					.join(' ')} ${template?.name ?? ''} ${template?.skill.name ?? ''}`.toLowerCase();
				const matchesQuery = !query || haystack.includes(query);
				const matchesTemplate = !templateId || item.templateId === templateId;
				const matchesTemplateSkill =
					!templateSkillId || template?.skillId === templateSkillId;
				const matchesProfileSkill =
					!profileSkillId ||
					item.attackProfiles.some(profile => profile.skillId === profileSkillId);
				const matchesAttackKind =
					!attackKind ||
					item.attackProfiles.some(profile => profile.kind === attackKind);
				const matchesActive =
					!activeFilter ||
					(activeFilter === 'active' ? item.isActive : !item.isActive);
				const matchesAmmo =
					!ammoFilter ||
					(ammoFilter === 'uses-ammo'
						? item.attackProfiles.some(profile => profile.usesAmmo)
						: item.attackProfiles.every(profile => !profile.usesAmmo));

				return (
					matchesQuery &&
					matchesTemplate &&
					matchesTemplateSkill &&
					matchesProfileSkill &&
					matchesAttackKind &&
					matchesActive &&
					matchesAmmo
				);
			})
			.sort(compareWeapons);
	});
	protected readonly weaponTreeGroups = computed<NavigationTreeGroup[]>(() =>
		buildWeaponTreeGroups(this.filteredWeapons(), this.templateById())
	);
	protected readonly title = computed(() => {
		const draft = this.draft();
		return draft?.id ? draft.name || 'Оружие' : 'Новое оружие';
	});

	constructor() {
		this.loadCatalog();
	}

	protected setSearchQuery(query: string) {
		this.searchQuery.set(query);
	}

	protected setTemplateIdFilter(templateId: string | null) {
		this.selectedTemplateIdFilter.set(templateId);
	}

	protected setTemplateSkillIdFilter(skillId: string | null) {
		this.selectedTemplateSkillIdFilter.set(skillId);
	}

	protected setProfileSkillIdFilter(skillId: string | null) {
		this.selectedProfileSkillIdFilter.set(skillId);
	}

	protected setAttackKindFilter(kind: AttackKindFilter | null) {
		this.selectedAttackKindFilter.set(kind);
	}

	protected setActiveFilter(value: ActiveFilter | null) {
		this.selectedActiveFilter.set(value);
	}

	protected setAmmoFilter(value: AmmoFilter | null) {
		this.selectedAmmoFilter.set(value);
	}

	protected resetFilters() {
		this.searchQuery.set('');
		this.selectedTemplateIdFilter.set(null);
		this.selectedTemplateSkillIdFilter.set(null);
		this.selectedProfileSkillIdFilter.set(null);
		this.selectedAttackKindFilter.set(null);
		this.selectedActiveFilter.set(null);
		this.selectedAmmoFilter.set(null);
	}

	protected selectWeaponById(weaponId: string) {
		const weapon = this.weapons().find(item => item.id === weaponId);
		if (weapon) {
			this.selectWeapon(weapon);
		}
	}

	protected toggleGroup(groupLabel: string) {
		this.collapsedGroups.update(groups => toggleSetValue(groups, groupLabel));
	}

	protected toggleSubgroup(event: { groupLabel: string; subgroupLabel: string }) {
		this.collapsedSubgroups.update(groups =>
			toggleSetValue(groups, subgroupKey(event.groupLabel, event.subgroupLabel))
		);
	}

	protected selectWeapon(weapon: Weapon) {
		if (weapon.id === this.selectedWeaponId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => this.setDraftFromWeapon(weapon)
		});
	}

	protected createWeapon() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				const template = this.templateOptions()[0] ?? null;
				const draft = createEmptyDraft(
					this.skills()[0]?.id ?? null,
					template,
					this.characteristics()[0]?.id ?? null
				);
				this.selectedWeaponId.set(null);
				this.draft.set(draft);
				this.savedDraftSignature.set(draftSignature(draft));
			}
		});
	}

	protected updateDraftName(name: string) {
		this.patchDraft({ name });
	}

	protected updateDraftTemplate(templateId: string | null) {
		const template = templateId
			? (this.templates().find(item => item.id === templateId) ?? null)
			: null;

		this.patchDraft({
			templateId,
			attackProfiles: template
				? template.attackProfiles.map(profileFromWeaponProfile)
				: this.draft()?.attackProfiles ?? []
		});
	}

	protected updateDraftSortOrder(sortOrder: number | null) {
		this.patchDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected updateDraftActive(isActive: boolean) {
		this.patchDraft({ isActive });
	}

	protected addAttackProfile(kind: WeaponAttackProfileKind) {
		const current = this.draft();

		if (!current || current.attackProfiles.some(profile => profile.kind === kind)) {
			return;
		}

		this.patchDraft({
			attackProfiles: [
				...current.attackProfiles,
				createEmptyProfileDraft(
					kind,
					this.skills()[0]?.id ?? null,
					this.characteristics()[0]?.id ?? null
				)
			]
		});
	}

	protected removeAttackProfile(index: number) {
		const current = this.draft();

		if (!current || current.attackProfiles.length <= 1) {
			return;
		}

		this.patchDraft({
			attackProfiles: current.attackProfiles.filter((_, itemIndex) => itemIndex !== index)
		});
	}

	protected updateProfileName(index: number, name: string) {
		this.patchProfile(index, { name });
	}

	protected updateProfileSkill(index: number, skillId: string | null) {
		this.patchProfile(index, { skillId });
	}

	protected updateProfileCharacteristic(index: number, characteristicId: string | null) {
		this.patchProfile(index, { characteristicId });
	}

	protected updateProfileBaseCost(index: number, baseCost: number | null) {
		this.patchProfile(index, { baseCost: baseCost ?? 0 });
	}

	protected updateProfileBaseDamage(index: number, baseDamage: number | null) {
		this.patchProfile(index, { baseDamage: baseDamage ?? 0 });
	}

	protected updateProfileRange(index: number, rangeMeters: number | null) {
		this.patchProfile(index, { rangeMeters: rangeMeters ?? 1 });
	}

	protected updateProfileUsesAmmo(index: number, usesAmmo: boolean) {
		this.patchProfile(index, { usesAmmo });
	}

	protected updateProfileActive(index: number, isActive: boolean) {
		this.patchProfile(index, { isActive });
	}

	protected updateProfileIntentIds(index: number, combatIntentIds: string[]) {
		this.patchProfile(index, { combatIntentIds });
	}

	protected updateProfileIntent(
		index: number,
		combatIntentId: string,
		selected: boolean
	) {
		const profile = this.draft()?.attackProfiles[index];

		if (!profile) {
			return;
		}

		const nextIds = selected
			? [...new Set([...profile.combatIntentIds, combatIntentId])]
			: profile.combatIntentIds.filter(id => id !== combatIntentId);

		this.patchProfile(index, { combatIntentIds: nextIds });
	}

	protected updateProfileDamageTypeIds(index: number, damageTypeIds: string[]) {
		this.patchProfile(index, { damageTypeIds });
	}

	protected profileKindLabel(kind: WeaponAttackProfileKind) {
		return kind === 'melee' ? 'Ближняя атака' : 'Дистанционная атака';
	}

	protected resetDraft() {
		const weapon = this.selectedWeapon();

		if (weapon) {
			this.setDraftFromWeapon(weapon);
			return;
		}

		const template = this.templateOptions()[0] ?? null;
		const draft = createEmptyDraft(
			this.skills()[0]?.id ?? null,
			template,
			this.characteristics()[0]?.id ?? null
		);
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
			this.errorMessage.set('Название оружия обязательно.');
			return;
		}

		if (!draft.attackProfiles.length) {
			this.errorMessage.set('Нужно настроить хотя бы один профиль атаки.');
			return;
		}

		if (!draft.templateId) {
			this.errorMessage.set('Шаблон оружия обязателен.');
			return;
		}

		if (draft.attackProfiles.some(profile => !profile.skillId)) {
			this.errorMessage.set('Навык обязателен для каждого профиля атаки.');
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		const command = {
			name,
			templateId: draft.templateId,
			attackProfiles: draft.attackProfiles.map((profile, index) => ({
				id: profile.id ?? undefined,
				kind: profile.kind,
				name: profile.name.trim() || this.profileKindLabel(profile.kind),
				skillId: profile.skillId as string,
				characteristicId: profile.characteristicId ?? undefined,
				baseCost: profile.baseCost,
				baseDamage: profile.baseDamage,
				rangeMeters: profile.rangeMeters,
				usesAmmo: profile.usesAmmo,
				isActive: profile.isActive,
				sortOrder: profile.sortOrder || index,
				intents: profile.combatIntentIds.map((combatIntentId, intentIndex) => ({
					combatIntentId,
					sortOrder: intentIndex
				})),
				damageTypeIds: profile.damageTypeIds
			})),
			isActive: draft.isActive,
			sortOrder: draft.sortOrder
		};
		const request = draft.id
			? this.repository.updateWeapon(draft.id, command)
			: this.repository.createWeapon(command);

		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: saved => {
				this.upsertWeapon(saved);
				this.setDraftFromWeapon(saved);
				this.saving.set(false);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error ? error.message : 'Не удалось сохранить оружие.'
				);
				this.saving.set(false);
			}
		});
	}

	protected deleteSelectedWeapon() {
		const draft = this.draft();

		if (!draft?.id || this.saving()) {
			return;
		}

		this.confirmationService.confirm({
			header: 'Удалить оружие?',
			message: `«${draft.name}» будет удалено из справочника оружия.`,
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.deleteWeapon(draft.id as string)
		});
	}

	private loadCatalog() {
		this.loading.set(true);
		this.errorMessage.set(null);
		this.repository
			.loadCatalog()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => {
					this.weapons.set(catalog.weapons);
					this.templates.set(catalog.templates);
					this.skills.set(catalog.skills);
					this.characteristics.set(catalog.characteristics);
					this.combatIntents.set(catalog.combatIntents);
					this.damageTypes.set(catalog.damageTypes);
					this.loading.set(false);
					this.selectInitialWeapon();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить справочник оружия.'
					);
					this.loading.set(false);
				}
			});
	}

	private selectInitialWeapon() {
		const weapon = [...this.weapons()].sort(compareWeapons)[0];

		if (weapon) {
			this.setDraftFromWeapon(weapon);
			return;
		}

		const template = this.templateOptions()[0] ?? null;
		const draft = createEmptyDraft(
			this.skills()[0]?.id ?? null,
			template,
			this.characteristics()[0]?.id ?? null
		);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private setDraftFromWeapon(weapon: Weapon) {
		const draft: WeaponDraft = {
			id: weapon.id,
			name: weapon.name,
			templateId: weapon.templateId,
			isActive: weapon.isActive,
			sortOrder: weapon.sortOrder,
			attackProfiles: profilesFromWeapon(weapon)
		};

		this.selectedWeaponId.set(weapon.id);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private patchDraft(patch: Partial<WeaponDraft>) {
		const current = this.draft();

		if (!current) {
			return;
		}

		this.draft.set({ ...current, ...patch });
	}

	private patchProfile(index: number, patch: Partial<WeaponAttackProfileDraft>) {
		const current = this.draft();

		if (!current) {
			return;
		}

		this.patchDraft({
			attackProfiles: current.attackProfiles.map((profile, itemIndex) =>
				itemIndex === index ? { ...profile, ...patch } : profile
			)
		});
	}

	private upsertWeapon(weapon: Weapon) {
		this.weapons.update(items => {
			const exists = items.some(item => item.id === weapon.id);
			const nextItems = exists
				? items.map(item => (item.id === weapon.id ? weapon : item))
				: [...items, weapon];

			return nextItems.sort(compareWeapons);
		});
	}

	private deleteWeapon(id: string) {
		this.saving.set(true);
		this.repository
			.deleteWeapon(id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.weapons.update(items => items.filter(item => item.id !== id));
					this.selectedWeaponId.set(null);
					this.draft.set(null);
					this.savedDraftSignature.set('');
					this.saving.set(false);
					this.selectInitialWeapon();
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error ? error.message : 'Не удалось удалить оружие.'
					);
					this.saving.set(false);
				}
			});
	}
}

function createEmptyDraft(
	skillId: string | null,
	template: WeaponTemplate | null,
	characteristicId: string | null
): WeaponDraft {
	return {
		id: null,
		name: '',
		templateId: template?.id ?? null,
		isActive: true,
		sortOrder: 0,
		attackProfiles: template
			? template.attackProfiles.map(profileFromWeaponProfile)
			: [createEmptyProfileDraft('melee', skillId, characteristicId)]
	};
}

function createEmptyProfileDraft(
	kind: WeaponAttackProfileKind,
	skillId: string | null,
	characteristicId: string | null
): WeaponAttackProfileDraft {
	return {
		id: null,
		kind,
		name: kind === 'melee' ? 'Ближняя атака' : 'Дистанционная атака',
		skillId,
		characteristicId,
		baseCost: 0,
		baseDamage: 0,
		rangeMeters: kind === 'melee' ? 1 : 10,
		usesAmmo: kind === 'ranged',
		isActive: true,
		sortOrder: kind === 'melee' ? 0 : 1,
		combatIntentIds: [],
		damageTypeIds: []
	};
}

function profilesFromWeapon(weapon: Weapon): WeaponAttackProfileDraft[] {
	if (weapon.attackProfiles.length) {
		return weapon.attackProfiles.map(profileFromWeaponProfile);
	}

	return [
		{
			id: null,
			kind: 'melee',
			name: 'Ближняя атака',
			skillId: weapon.skillId,
			characteristicId: null,
			baseCost: 0,
			baseDamage: weapon.extraDamage,
			rangeMeters: 1,
			usesAmmo: false,
			isActive: weapon.isActive,
			sortOrder: 0,
			combatIntentIds: [],
			damageTypeIds: []
		}
	];
}

function profileFromWeaponProfile(
	profile: WeaponAttackProfile
): WeaponAttackProfileDraft {
	return {
		id: profile.id,
		kind: profile.kind,
		name: profile.name,
		skillId: profile.skillId,
		characteristicId: profile.characteristicId,
		baseCost: profile.baseCost,
		baseDamage: profile.baseDamage,
		rangeMeters: profile.rangeMeters,
		usesAmmo: profile.usesAmmo,
	isActive: profile.isActive,
	sortOrder: profile.sortOrder,
	combatIntentIds: profile.intents.map(intent => intent.combatIntentId),
	damageTypeIds: profile.damageTypeIds
	};
}

function draftSignature(draft: WeaponDraft | null) {
	return draft
		? JSON.stringify({
				id: draft.id,
				name: draft.name.trim(),
				templateId: draft.templateId,
				isActive: draft.isActive,
				sortOrder: draft.sortOrder,
				attackProfiles: draft.attackProfiles.map(profile => ({
					id: profile.id,
					kind: profile.kind,
					name: profile.name.trim(),
					skillId: profile.skillId,
					characteristicId: profile.characteristicId,
					baseCost: profile.baseCost,
					baseDamage: profile.baseDamage,
					rangeMeters: profile.rangeMeters,
					usesAmmo: profile.usesAmmo,
					isActive: profile.isActive,
					sortOrder: profile.sortOrder,
					combatIntentIds: [...profile.combatIntentIds].sort(),
					damageTypeIds: [...profile.damageTypeIds].sort()
				}))
			})
		: '';
}

function buildSkillGroups(skills: WeaponSkillOption[]): WeaponSkillOptionGroup[] {
	const groupMap = new Map<string, WeaponSkillOptionGroup>();

	for (const skill of skills) {
		const groupKey = skill.category.id;
		const group = groupMap.get(groupKey);

		if (group) {
			group.items.push(skill);
			continue;
		}

		groupMap.set(groupKey, {
			label: skill.category.name,
			items: [skill]
		});
	}

	return [...groupMap.values()];
}

function buildCombatIntentGroups(
	intents: WeaponCombatIntentOption[]
): WeaponCombatIntentOptionGroup[] {
	const groupMap = new Map<string, WeaponCombatIntentOptionGroup>();

	for (const intent of intents) {
		const group = groupMap.get(intent.category);
		if (group) {
			group.items.push(intent);
			continue;
		}

		groupMap.set(intent.category, {
			label: intent.category,
			items: [intent]
		});
	}

	return [...groupMap.values()];
}

function buildWeaponTreeGroups(
	weapons: Weapon[],
	templates: ReadonlyMap<string, WeaponTemplate>
): NavigationTreeGroup[] {
	const groupMap = new Map<
		string,
		{
			label: string;
			sortOrder: number;
			subgroups: Map<
				string,
				{
					label: string;
					sortOrder: number;
					items: Array<{ id: string; label: string; sortOrder: number }>;
				}
			>;
		}
	>();

	for (const weapon of weapons) {
		const template = templates.get(weapon.templateId);
		const groupLabel = template?.skill.name ?? 'Без навыка шаблона';
		const groupSortOrder = template?.skill.sortOrder ?? 9999;
		const subgroupLabel = template?.name ?? weapon.template.name;
		const subgroupSortOrder = template?.sortOrder ?? 9999;
		const group =
			groupMap.get(groupLabel) ??
			{
				label: groupLabel,
				sortOrder: groupSortOrder,
				subgroups: new Map()
			};
		const subgroup =
			group.subgroups.get(subgroupLabel) ??
			{
				label: subgroupLabel,
				sortOrder: subgroupSortOrder,
				items: []
			};

		subgroup.items.push({
			id: weapon.id,
			label: weapon.name,
			sortOrder: weapon.sortOrder
		});
		group.subgroups.set(subgroupLabel, subgroup);
		groupMap.set(groupLabel, group);
	}

	return [...groupMap.values()]
		.sort((first, second) => first.sortOrder - second.sortOrder || first.label.localeCompare(second.label, 'ru'))
		.map(group => {
			const subgroups = [...group.subgroups.values()]
				.sort((first, second) => first.sortOrder - second.sortOrder || first.label.localeCompare(second.label, 'ru'))
				.map(subgroup => ({
					label: subgroup.label,
					items: subgroup.items
						.sort((first, second) => first.sortOrder - second.sortOrder || first.label.localeCompare(second.label, 'ru'))
						.map(item => ({
							id: item.id,
							label: item.label
						}))
				}));

			return {
				label: group.label,
				count: subgroups.reduce((total, subgroup) => total + subgroup.items.length, 0),
				items: [],
				subgroups
			};
		});
}

function uniqueById<T extends { id: string }>(items: T[]) {
	const map = new Map<string, T>();
	for (const item of items) {
		map.set(item.id, item);
	}
	return [...map.values()];
}

function toggleSetValue(values: ReadonlySet<string>, value: string) {
	const next = new Set(values);
	if (next.has(value)) {
		next.delete(value);
	} else {
		next.add(value);
	}
	return next;
}

function subgroupKey(groupLabel: string, subgroupLabel: string) {
	return `${groupLabel}::${subgroupLabel}`;
}

function compareWeapons(first: Weapon, second: Weapon) {
	const orderDiff = first.sortOrder - second.sortOrder;
	return orderDiff || first.name.localeCompare(second.name, 'ru');
}
