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
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { EMPTY, catchError, finalize } from 'rxjs';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { NavigationTreeComponent } from '../../../../../shared/ui/navigation-tree/navigation-tree.component';
import { NavigationTreeGroup } from '../../../../../shared/ui/navigation-tree/navigation-tree.models';
import { WEAPONS_REPOSITORY } from '../../../data/weapons-repository.port';
import {
	NaturalAttack,
	WeaponAttackProfileKind,
	WeaponCharacteristicOption,
	WeaponCombatIntentOption,
	WeaponDamageTypeOption,
	WeaponSkillOption,
	WeaponSkillOptionGroup
} from '../../../domain/weapons.models';
import { SaveWeaponAttackProfileDto } from '../../../data/dto/weapons.dto';

interface NaturalAttackDraft {
	id: string | null;
	name: string;
	skillId: string;
	attackProfiles: NaturalAttackProfileDraft[];
	isActive: boolean;
	sortOrder: number;
}

interface NaturalAttackProfileDraft {
	kind: WeaponAttackProfileKind;
	name: string;
	skillId: string;
	characteristicId: string | null;
	baseCost: number;
	baseDamage: number;
	rangeMeters: number;
	usesAmmo: boolean;
	canBeParried: boolean;
	damageTypeIds: string[];
	combatIntentIds: string[];
	isActive: boolean;
	sortOrder: number;
}

interface CombatIntentGroup {
	label: string;
	items: WeaponCombatIntentOption[];
}

@Component({
	selector: 'app-admin-natural-attacks-page',
	imports: [
		Breadcrumb,
		Button,
		Checkbox,
		EditorActionsBarComponent,
		FormsModule,
		InputNumber,
		InputText,
		NavigationTreeComponent,
		Select,
		ToggleSwitch
	],
	templateUrl: './admin-natural-attacks-page.component.html',
	styleUrl: './admin-natural-attacks-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminNaturalAttacksPageComponent {
	private readonly destroyRef = inject(DestroyRef);
	private readonly weaponsRepository = inject(WEAPONS_REPOSITORY);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Естественные атаки' }
	];
	protected readonly naturalAttacks = signal<NaturalAttack[]>([]);
	protected readonly skills = signal<WeaponSkillOption[]>([]);
	protected readonly characteristics = signal<WeaponCharacteristicOption[]>([]);
	protected readonly combatIntents = signal<WeaponCombatIntentOption[]>([]);
	protected readonly damageTypes = signal<WeaponDamageTypeOption[]>([]);
	protected readonly selectedNaturalAttackId = signal<string | null>(null);
	protected readonly draft = signal<NaturalAttackDraft | null>(null);
	protected readonly savedDraft = signal<NaturalAttackDraft | null>(null);
	protected readonly collapsedGroups = signal<Set<string>>(new Set());
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);

	protected readonly title = computed(
		() => this.draft()?.name.trim() || 'Новая естественная атака'
	);
	protected readonly hasChanges = computed(
		() => JSON.stringify(this.draft()) !== JSON.stringify(this.savedDraft())
	);
	protected readonly skillGroups = computed<WeaponSkillOptionGroup[]>(() => {
		const groups = new Map<string, WeaponSkillOptionGroup>();
		for (const skill of this.skills()) {
			const label = skill.category.name;
			const group = groups.get(label) ?? { label, items: [] };
			group.items.push(skill);
			groups.set(label, group);
		}
		return [...groups.values()];
	});
	protected readonly combatIntentGroups = computed<CombatIntentGroup[]>(() => {
		const groups = new Map<string, CombatIntentGroup>();
		for (const intent of this.combatIntents()) {
			const label = intent.category || 'Без категории';
			const group = groups.get(label) ?? { label, items: [] };
			group.items.push(intent);
			groups.set(label, group);
		}
		return [...groups.values()];
	});
	protected readonly navigationGroups = computed<NavigationTreeGroup[]>(() => {
		const groups = new Map<string, NavigationTreeGroup>();
		for (const attack of this.naturalAttacks()) {
			const label = attack.skill.category.name;
			const group =
				groups.get(label) ??
				({
					id: label,
					label,
					count: 0,
					items: [],
					subgroups: []
				} satisfies NavigationTreeGroup);
			group.count += 1;
			group.items.push({
				id: attack.id,
				label: attack.name
			});
			groups.set(label, group);
		}
		return [...groups.values()];
	});

	constructor() {
		this.loadCatalog();
	}

	protected createNaturalAttack() {
		const skill = this.skills()[0];
		if (!skill) {
			this.errorMessage.set('Сначала настрой навыки.');
			return;
		}
		const next = {
			id: null,
			name: 'Новая естественная атака',
			skillId: skill.id,
			attackProfiles: [this.createProfile('melee', skill.id)],
			isActive: true,
			sortOrder: 0
		};
		this.selectedNaturalAttackId.set(null);
		this.setDraft(next);
	}

	protected selectNaturalAttackById(id: string) {
		const attack = this.naturalAttacks().find(item => item.id === id);
		if (!attack) {
			return;
		}
		this.selectedNaturalAttackId.set(id);
		this.setDraft(this.toDraft(attack));
	}

	protected updateDraft(patch: Partial<NaturalAttackDraft>) {
		this.draft.update(draft => (draft ? { ...draft, ...patch } : draft));
	}

	protected updateSkill(skillId: string) {
		this.draft.update(draft =>
			draft
				? {
						...draft,
						skillId,
						attackProfiles: draft.attackProfiles.map(profile => ({
							...profile,
							skillId
						}))
					}
				: draft
		);
	}

	protected addProfile(kind: WeaponAttackProfileKind) {
		const draft = this.draft();
		if (!draft || !this.canAddProfile(kind)) {
			return;
		}
		this.updateDraft({
			attackProfiles: [
				...draft.attackProfiles,
				this.createProfile(kind, draft.skillId)
			]
		});
	}

	protected canAddProfile(kind: WeaponAttackProfileKind) {
		return !this.draft()?.attackProfiles.some(profile => profile.kind === kind);
	}

	protected removeProfile(index: number) {
		const draft = this.draft();
		if (!draft || draft.attackProfiles.length <= 1) {
			return;
		}
		this.updateDraft({
			attackProfiles: draft.attackProfiles.filter(
				(_, itemIndex) => itemIndex !== index
			)
		});
	}

	protected updateProfile(
		index: number,
		patch: Partial<NaturalAttackProfileDraft>
	) {
		const draft = this.draft();
		if (!draft) {
			return;
		}
		this.updateDraft({
			attackProfiles: draft.attackProfiles.map((profile, itemIndex) =>
				itemIndex === index ? { ...profile, ...patch } : profile
			)
		});
	}

	protected updateProfileDamageType(
		index: number,
		damageTypeId: string,
		checked: boolean
	) {
		const profile = this.draft()?.attackProfiles[index];
		if (!profile) {
			return;
		}
		this.updateProfile(index, {
			damageTypeIds: checked
				? [...profile.damageTypeIds, damageTypeId]
				: profile.damageTypeIds.filter(id => id !== damageTypeId)
		});
	}

	protected updateProfileIntent(
		index: number,
		combatIntentId: string,
		checked: boolean
	) {
		const profile = this.draft()?.attackProfiles[index];
		if (!profile) {
			return;
		}
		this.updateProfile(index, {
			combatIntentIds: checked
				? [...profile.combatIntentIds, combatIntentId]
				: profile.combatIntentIds.filter(id => id !== combatIntentId)
		});
	}

	protected saveDraft() {
		const draft = this.draft();
		if (!draft) {
			return;
		}
		this.saving.set(true);
		this.errorMessage.set(null);
		const command = this.toSaveCommand(draft);
		const request = draft.id
			? this.weaponsRepository.updateNaturalAttack(draft.id, command)
			: this.weaponsRepository.createNaturalAttack(command);

		request
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось сохранить естественную атаку.'
					);
					return EMPTY;
				}),
				finalize(() => this.saving.set(false)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(saved => {
				this.upsertNaturalAttack(saved);
				this.selectedNaturalAttackId.set(saved.id);
				this.setDraft(this.toDraft(saved));
			});
	}

	protected resetDraft() {
		const saved = this.savedDraft();
		this.draft.set(saved ? structuredClone(saved) : null);
	}

	protected toggleGroup(groupId: string) {
		this.collapsedGroups.update(groups => {
			const next = new Set(groups);
			if (next.has(groupId)) {
				next.delete(groupId);
			} else {
				next.add(groupId);
			}
			return next;
		});
	}

	protected profileKindLabel(kind: WeaponAttackProfileKind) {
		return kind === 'melee' ? 'Ближняя атака' : 'Дистанционная атака';
	}

	private loadCatalog() {
		this.loading.set(true);
		this.errorMessage.set(null);
		this.weaponsRepository
			.loadNaturalAttacksCatalog()
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить естественные атаки.'
					);
					return EMPTY;
				}),
				finalize(() => this.loading.set(false)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(catalog => {
				this.naturalAttacks.set(catalog.naturalAttacks);
				this.skills.set(catalog.skills);
				this.characteristics.set(catalog.characteristics);
				this.combatIntents.set(catalog.combatIntents);
				this.damageTypes.set(catalog.damageTypes);
				const selected = catalog.naturalAttacks[0];
				if (selected) {
					this.selectedNaturalAttackId.set(selected.id);
					this.setDraft(this.toDraft(selected));
				} else {
					this.createNaturalAttack();
				}
			});
	}

	private createProfile(
		kind: WeaponAttackProfileKind,
		skillId: string
	): NaturalAttackProfileDraft {
		return {
			kind,
			name: this.profileKindLabel(kind),
			skillId,
			characteristicId: this.characteristics()[0]?.id ?? null,
			baseCost: 1,
			baseDamage: 0,
			rangeMeters: 1,
			usesAmmo: false,
			canBeParried: kind === 'melee',
			damageTypeIds: [],
			combatIntentIds: [],
			isActive: true,
			sortOrder: kind === 'melee' ? 0 : 1
		};
	}

	private toDraft(attack: NaturalAttack): NaturalAttackDraft {
		return {
			id: attack.id,
			name: attack.name,
			skillId: attack.skillId,
			attackProfiles: attack.attackProfiles.map(profile => ({
				kind: profile.kind,
				name: profile.name,
				skillId: profile.skillId,
				characteristicId: profile.characteristicId,
				baseCost: profile.baseCost,
				baseDamage: profile.baseDamage,
				rangeMeters: profile.rangeMeters,
				usesAmmo: profile.usesAmmo,
				canBeParried: profile.canBeParried,
				damageTypeIds: [...profile.damageTypeIds],
				combatIntentIds: profile.intents.map(intent => intent.combatIntentId),
				isActive: profile.isActive,
				sortOrder: profile.sortOrder
			})),
			isActive: attack.isActive,
			sortOrder: attack.sortOrder
		};
	}

	private setDraft(draft: NaturalAttackDraft) {
		const saved = structuredClone(draft);
		this.draft.set(structuredClone(saved));
		this.savedDraft.set(saved);
	}

	private toSaveCommand(draft: NaturalAttackDraft) {
		return {
			name: draft.name,
			skillId: draft.skillId,
			isActive: draft.isActive,
			sortOrder: draft.sortOrder,
			attackProfiles: draft.attackProfiles.map(
				(profile, index): SaveWeaponAttackProfileDto => ({
					kind: profile.kind,
					name: profile.name,
					skillId: profile.skillId,
					characteristicId: profile.characteristicId ?? undefined,
					baseCost: profile.baseCost,
					baseDamage: profile.baseDamage,
					rangeMeters: profile.rangeMeters,
					usesAmmo: profile.usesAmmo,
					canBeParried: profile.canBeParried,
					damageTypeIds: profile.damageTypeIds,
					isActive: profile.isActive,
					sortOrder: profile.sortOrder ?? index,
					intents: profile.combatIntentIds.map(
						(combatIntentId, intentIndex) => ({
							combatIntentId,
							sortOrder: intentIndex
						})
					)
				})
			)
		};
	}

	private upsertNaturalAttack(saved: NaturalAttack) {
		this.naturalAttacks.update(attacks => {
			const exists = attacks.some(attack => attack.id === saved.id);
			const next = exists
				? attacks.map(attack => (attack.id === saved.id ? saved : attack))
				: [...attacks, saved];
			return next.sort((left, right) => {
				const order = left.sortOrder - right.sortOrder;
				return order === 0 ? left.name.localeCompare(right.name) : order;
			});
		});
	}
}
