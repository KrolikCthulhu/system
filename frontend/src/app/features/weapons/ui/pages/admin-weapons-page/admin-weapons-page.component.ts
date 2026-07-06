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
import { WEAPONS_REPOSITORY } from '../../../data/weapons-repository.port';
import {
	Weapon,
	WeaponSkillOption,
	WeaponSkillOptionGroup
} from '../../../domain/weapons.models';

interface WeaponDraft {
	id: string | null;
	name: string;
	skillId: string | null;
	extraDamage: number;
	isActive: boolean;
	sortOrder: number;
}

@Component({
	selector: 'app-admin-weapons-page',
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
	protected readonly weapons = signal<Weapon[]>([]);
	protected readonly skills = signal<WeaponSkillOption[]>([]);
	protected readonly draft = signal<WeaponDraft | null>(null);
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);

	protected readonly hasChanges = computed(
		() => draftSignature(this.draft()) !== this.savedDraftSignature()
	);
	protected readonly selectedWeapon = computed(() => {
		const id = this.selectedWeaponId();
		return id ? (this.weapons().find(item => item.id === id) ?? null) : null;
	});
	protected readonly skillGroups = computed(() =>
		buildSkillGroups(this.skills().filter(skill => skill.isActive))
	);
	protected readonly filteredWeapons = computed(() => {
		const query = this.searchQuery().trim().toLowerCase();
		return this.weapons()
			.filter(item => {
				const haystack =
					`${item.name} ${item.skill.name} ${item.skill.category.name} ${item.extraDamage}`.toLowerCase();
				return !query || haystack.includes(query);
			})
			.sort(compareWeapons);
	});
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
				const draft = createEmptyDraft(this.skills()[0]?.id ?? null);
				this.selectedWeaponId.set(null);
				this.draft.set(draft);
				this.savedDraftSignature.set(draftSignature(draft));
			}
		});
	}

	protected updateDraftName(name: string) {
		this.patchDraft({ name });
	}

	protected updateDraftSkill(skillId: string | null) {
		this.patchDraft({ skillId });
	}

	protected updateDraftExtraDamage(extraDamage: number | null) {
		this.patchDraft({ extraDamage: extraDamage ?? 0 });
	}

	protected updateDraftSortOrder(sortOrder: number | null) {
		this.patchDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected updateDraftActive(isActive: boolean) {
		this.patchDraft({ isActive });
	}

	protected resetDraft() {
		const weapon = this.selectedWeapon();

		if (weapon) {
			this.setDraftFromWeapon(weapon);
			return;
		}

		const draft = createEmptyDraft(this.skills()[0]?.id ?? null);
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

		if (!draft.skillId) {
			this.errorMessage.set('Навык оружия обязателен.');
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		const command = {
			name,
			skillId: draft.skillId,
			extraDamage: draft.extraDamage,
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
					this.skills.set(catalog.skills);
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

		const draft = createEmptyDraft(this.skills()[0]?.id ?? null);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private setDraftFromWeapon(weapon: Weapon) {
		const draft: WeaponDraft = {
			id: weapon.id,
			name: weapon.name,
			skillId: weapon.skillId,
			extraDamage: weapon.extraDamage,
			isActive: weapon.isActive,
			sortOrder: weapon.sortOrder
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

function createEmptyDraft(skillId: string | null): WeaponDraft {
	return {
		id: null,
		name: '',
		skillId,
		extraDamage: 0,
		isActive: true,
		sortOrder: 0
	};
}

function draftSignature(draft: WeaponDraft | null) {
	return draft
		? JSON.stringify({
				id: draft.id,
				name: draft.name.trim(),
				skillId: draft.skillId,
				extraDamage: draft.extraDamage,
				isActive: draft.isActive,
				sortOrder: draft.sortOrder
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

function compareWeapons(first: Weapon, second: Weapon) {
	const orderDiff = first.sortOrder - second.sortOrder;
	return orderDiff || first.name.localeCompare(second.name, 'ru');
}
