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
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { NavigationTreeComponent } from '../../../../../shared/ui/navigation-tree/navigation-tree.component';
import { NavigationTreeGroup } from '../../../../../shared/ui/navigation-tree/navigation-tree.models';
import { WEAPONS_REPOSITORY } from '../../../data/weapons-repository.port';
import {
	WeaponAttackProfileKind,
	WeaponCharacteristicOption,
	WeaponCombatIntentOption,
	WeaponCombatIntentOptionGroup,
	WeaponDamageTypeOption,
	WeaponSkillOption,
	WeaponSkillOptionGroup,
	WeaponTemplate
} from '../../../domain/weapons.models';

interface TemplateProfileDraft {
	kind: WeaponAttackProfileKind;
	name: string;
	skillId: string | null;
	characteristicId: string | null;
	baseCost: number;
	baseDamage: number;
	rangeMeters: number;
	usesAmmo: boolean;
	canBeParried: boolean;
	isActive: boolean;
	sortOrder: number;
	combatIntentIds: string[];
	damageTypeIds: string[];
}

interface TemplateDraft {
	id: string | null;
	name: string;
	skillId: string | null;
	handsMin: number;
	handsMax: number;
	defaultHands: number;
	isActive: boolean;
	sortOrder: number;
	attackProfiles: TemplateProfileDraft[];
}

@Component({
	selector: 'app-admin-weapon-templates-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		Breadcrumb,
		Button,
		Checkbox,
		InputNumber,
		InputText,
		NavigationTreeComponent,
		Select,
		ToggleSwitch,
		EditorActionsBarComponent
	],
	templateUrl: './admin-weapon-templates-page.component.html',
	styleUrl: './admin-weapon-templates-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminWeaponTemplatesPageComponent {
	private readonly repository = inject(WEAPONS_REPOSITORY);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Шаблоны оружия' }
	];
	protected readonly templates = signal<WeaponTemplate[]>([]);
	protected readonly skills = signal<WeaponSkillOption[]>([]);
	protected readonly characteristics = signal<WeaponCharacteristicOption[]>([]);
	protected readonly combatIntents = signal<WeaponCombatIntentOption[]>([]);
	protected readonly damageTypes = signal<WeaponDamageTypeOption[]>([]);
	protected readonly selectedTemplateId = signal<string | null>(null);
	protected readonly collapsedGroups = signal<ReadonlySet<string>>(new Set());
	protected readonly draft = signal<TemplateDraft | null>(null);
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);

	protected readonly hasChanges = computed(
		() => signature(this.draft()) !== this.savedDraftSignature()
	);
	protected readonly sortedTemplates = computed(() =>
		[...this.templates()].sort(compareTemplates)
	);
	protected readonly templateGroups = computed<NavigationTreeGroup[]>(() => {
		const groups = new Map<string, WeaponTemplate[]>();

		for (const template of this.sortedTemplates()) {
			const groupTemplates = groups.get(template.skill.name) ?? [];
			groupTemplates.push(template);
			groups.set(template.skill.name, groupTemplates);
		}

		return [...groups.entries()].map(([label, templates]) => ({
			label,
			count: templates.length,
			subgroups: [],
			items: templates.map(template => ({
				id: template.id,
				label: template.name
			}))
		}));
	});
	protected readonly skillGroups = computed(() =>
		buildSkillGroups(this.skills().filter(skill => skill.isActive))
	);
	protected readonly characteristicOptions = computed(() =>
		this.characteristics().filter(item => item.isActive)
	);
	protected readonly combatIntentOptions = computed(() =>
		this.combatIntents().filter(item => item.isActive)
	);
	protected readonly combatIntentGroups = computed<
		WeaponCombatIntentOptionGroup[]
	>(() => buildCombatIntentGroups(this.combatIntentOptions()));
	protected readonly damageTypeOptions = computed(() =>
		this.damageTypes().filter(item => item.isActive)
	);
	protected readonly title = computed(
		() => this.draft()?.name || 'Новый шаблон'
	);

	constructor() {
		this.loadCatalog();
	}

	protected createTemplate() {
		const draft = emptyDraft(
			this.skills()[0]?.id ?? null,
			this.characteristics()[0]?.id ?? null
		);
		this.selectedTemplateId.set(null);
		this.draft.set(draft);
		this.savedDraftSignature.set(signature(draft));
	}

	protected selectTemplate(template: WeaponTemplate) {
		this.selectedTemplateId.set(template.id);
		const draft = draftFromTemplate(template);
		this.draft.set(draft);
		this.savedDraftSignature.set(signature(draft));
	}

	protected selectTemplateById(templateId: string) {
		const template = this.templates().find(item => item.id === templateId);
		if (template) {
			this.selectTemplate(template);
		}
	}

	protected toggleGroup(groupLabel: string) {
		this.collapsedGroups.update(groups => {
			const next = new Set(groups);
			if (next.has(groupLabel)) {
				next.delete(groupLabel);
			} else {
				next.add(groupLabel);
			}
			return next;
		});
	}

	protected updateName(name: string) {
		this.patchDraft({ name });
	}

	protected updateSkill(skillId: string | null) {
		this.patchDraft({ skillId });
	}

	protected updateHandsMin(handsMin: number | null) {
		const value = handsMin ?? 0;
		const draft = this.draft();
		const nextMax = Math.max(draft?.handsMax ?? value, value);
		this.patchDraft({
			handsMin: value,
			handsMax: nextMax,
			defaultHands: clamp(draft?.defaultHands ?? value, value, nextMax)
		});
	}

	protected updateHandsMax(handsMax: number | null) {
		const value = handsMax ?? 0;
		const draft = this.draft();
		const nextMin = Math.min(draft?.handsMin ?? value, value);
		this.patchDraft({
			handsMin: nextMin,
			handsMax: value,
			defaultHands: clamp(draft?.defaultHands ?? value, nextMin, value)
		});
	}

	protected updateDefaultHands(defaultHands: number | null) {
		const draft = this.draft();
		this.patchDraft({
			defaultHands: clamp(
				defaultHands ?? draft?.handsMin ?? 0,
				draft?.handsMin ?? 0,
				draft?.handsMax ?? 0
			)
		});
	}

	protected updateSortOrder(sortOrder: number | null) {
		this.patchDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected updateActive(isActive: boolean) {
		this.patchDraft({ isActive });
	}

	protected addProfile(kind: WeaponAttackProfileKind) {
		const current = this.draft();
		if (
			!current ||
			current.attackProfiles.some(profile => profile.kind === kind)
		) {
			return;
		}
		this.patchDraft({
			attackProfiles: [
				...current.attackProfiles,
				emptyProfile(
					kind,
					this.skills()[0]?.id ?? null,
					this.characteristics()[0]?.id ?? null
				)
			]
		});
	}

	protected removeProfile(index: number) {
		const current = this.draft();
		if (!current || current.attackProfiles.length <= 1) {
			return;
		}
		this.patchDraft({
			attackProfiles: current.attackProfiles.filter(
				(_, itemIndex) => itemIndex !== index
			)
		});
	}

	protected updateProfile(index: number, patch: Partial<TemplateProfileDraft>) {
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

		this.updateProfile(index, { combatIntentIds: nextIds });
	}

	protected updateProfileDamageTypeIds(index: number, damageTypeIds: string[]) {
		this.updateProfile(index, { damageTypeIds });
	}

	protected profileKindLabel(kind: WeaponAttackProfileKind) {
		return kind === 'melee' ? 'Ближняя атака' : 'Дистанционная атака';
	}

	protected canAddProfile(kind: WeaponAttackProfileKind) {
		return !this.draft()?.attackProfiles.some(profile => profile.kind === kind);
	}

	protected resetDraft() {
		const template = this.templates().find(
			item => item.id === this.selectedTemplateId()
		);
		if (template) {
			this.selectTemplate(template);
			return;
		}
		this.createTemplate();
	}

	protected saveDraft() {
		const draft = this.draft();
		if (!draft || !this.hasChanges() || this.saving()) {
			return;
		}
		const name = draft.name.trim();
		if (!name || !draft.skillId) {
			this.errorMessage.set('Название и навык шаблона обязательны.');
			return;
		}
		if (draft.attackProfiles.some(profile => !profile.skillId)) {
			this.errorMessage.set('Навык обязателен для каждого профиля.');
			return;
		}

		const command = {
			name,
			skillId: draft.skillId,
			handsMin: draft.handsMin,
			handsMax: draft.handsMax,
			defaultHands: draft.defaultHands,
			isActive: draft.isActive,
			sortOrder: draft.sortOrder,
			attackProfiles: draft.attackProfiles.map((profile, index) => ({
				kind: profile.kind,
				name: profile.name.trim() || this.profileKindLabel(profile.kind),
				skillId: profile.skillId as string,
				characteristicId: profile.characteristicId ?? undefined,
				baseCost: profile.baseCost,
				baseDamage: profile.baseDamage,
				rangeMeters: profile.rangeMeters,
				usesAmmo: profile.usesAmmo,
				canBeParried: profile.canBeParried,
				isActive: profile.isActive,
				sortOrder: profile.sortOrder || index,
				intents: profile.combatIntentIds.map((combatIntentId, intentIndex) => ({
					combatIntentId,
					sortOrder: intentIndex
				})),
				damageTypeIds: profile.damageTypeIds
			}))
		};
		const request = draft.id
			? this.repository.updateWeaponTemplate(draft.id, command)
			: this.repository.createWeaponTemplate(command);

		this.saving.set(true);
		this.errorMessage.set(null);
		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: saved => {
				this.templates.update(items => upsertTemplate(items, saved));
				this.selectTemplate(saved);
				this.saving.set(false);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error
						? error.message
						: 'Не удалось сохранить шаблон.'
				);
				this.saving.set(false);
			}
		});
	}

	private loadCatalog() {
		this.loading.set(true);
		this.repository
			.loadCatalog()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: catalog => {
					this.templates.set(catalog.templates);
					this.skills.set(catalog.skills);
					this.characteristics.set(catalog.characteristics);
					this.combatIntents.set(catalog.combatIntents);
					this.damageTypes.set(catalog.damageTypes);
					this.loading.set(false);
					const first = [...catalog.templates].sort(compareTemplates)[0];
					if (first) {
						this.selectTemplate(first);
					} else {
						this.createTemplate();
					}
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить шаблоны.'
					);
					this.loading.set(false);
				}
			});
	}

	private patchDraft(patch: Partial<TemplateDraft>) {
		const current = this.draft();
		if (current) {
			this.draft.set({ ...current, ...patch });
		}
	}
}

function emptyDraft(
	skillId: string | null,
	characteristicId: string | null
): TemplateDraft {
	return {
		id: null,
		name: '',
		skillId,
		handsMin: 1,
		handsMax: 1,
		defaultHands: 1,
		isActive: true,
		sortOrder: 0,
		attackProfiles: [emptyProfile('melee', skillId, characteristicId)]
	};
}

function emptyProfile(
	kind: WeaponAttackProfileKind,
	skillId: string | null,
	characteristicId: string | null
): TemplateProfileDraft {
	return {
		kind,
		name: kind === 'melee' ? 'Ближняя атака' : 'Дистанционная атака',
		skillId,
		characteristicId,
		baseCost: 0,
		baseDamage: 0,
		rangeMeters: kind === 'melee' ? 1 : 10,
		usesAmmo: kind === 'ranged',
		canBeParried: kind === 'melee',
		isActive: true,
		sortOrder: kind === 'melee' ? 0 : 1,
		combatIntentIds: [],
		damageTypeIds: []
	};
}

function draftFromTemplate(template: WeaponTemplate): TemplateDraft {
	return {
		id: template.id,
		name: template.name,
		skillId: template.skillId,
		handsMin: template.handsMin,
		handsMax: template.handsMax,
		defaultHands: template.defaultHands,
		isActive: template.isActive,
		sortOrder: template.sortOrder,
		attackProfiles: template.attackProfiles.map(profile => ({
			kind: profile.kind,
			name: profile.name,
			skillId: profile.skillId,
			characteristicId: profile.characteristicId,
			baseCost: profile.baseCost,
			baseDamage: profile.baseDamage,
			rangeMeters: profile.rangeMeters,
			usesAmmo: profile.usesAmmo,
			canBeParried: profile.canBeParried,
			isActive: profile.isActive,
			sortOrder: profile.sortOrder,
			combatIntentIds: profile.intents.map(intent => intent.combatIntentId),
			damageTypeIds: profile.damageTypeIds
		}))
	};
}

function signature(draft: TemplateDraft | null) {
	return draft ? JSON.stringify(draft) : '';
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

function upsertTemplate(items: WeaponTemplate[], template: WeaponTemplate) {
	const exists = items.some(item => item.id === template.id);
	return (
		exists
			? items.map(item => (item.id === template.id ? template : item))
			: [...items, template]
	).sort(compareTemplates);
}

function buildSkillGroups(
	skills: WeaponSkillOption[]
): WeaponSkillOptionGroup[] {
	const groupMap = new Map<string, WeaponSkillOptionGroup>();
	for (const skill of skills) {
		const group = groupMap.get(skill.category.id);
		if (group) {
			group.items.push(skill);
		} else {
			groupMap.set(skill.category.id, {
				label: skill.category.name,
				items: [skill]
			});
		}
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

function compareTemplates(first: WeaponTemplate, second: WeaponTemplate) {
	const orderDiff = first.sortOrder - second.sortOrder;
	return orderDiff || first.name.localeCompare(second.name, 'ru');
}
