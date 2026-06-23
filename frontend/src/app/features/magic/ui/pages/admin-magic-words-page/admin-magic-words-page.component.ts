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
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { Slider } from 'primeng/slider';
import { Tag } from 'primeng/tag';
import { Textarea } from 'primeng/textarea';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Tooltip } from 'primeng/tooltip';
import { forkJoin } from 'rxjs';
import { UnsavedChangesGuard } from '../../../../../shared/forms/unsaved-changes.guard';
import { EditorActionsBarComponent } from '../../../../../shared/ui/editor-actions-bar/editor-actions-bar.component';
import { CONDITIONS_REPOSITORY } from '../../../../conditions/data/conditions-repository.port';
import { Condition } from '../../../../conditions/domain/conditions.models';
import { DAMAGE_TYPES_REPOSITORY } from '../../../../damage-types/data/damage-types-repository.port';
import { DamageType } from '../../../../damage-types/domain/damage-types.models';
import { SKILLS_REPOSITORY } from '../../../../skills/data/skills-repository.port';
import { Skill, SkillCategory } from '../../../../skills/domain/skills.models';
import {
	AreaShapeKind,
	MagicWordAreaShape,
	MAGIC_WORD_TYPE_OPTIONS,
	MagicWord,
	MagicWordEssenceProfile,
	MagicWordType,
	magicWordTypeLabel,
	magicWordTypePluralLabel
} from '../../../domain/magic-word.models';
import { MAGIC_WORDS_REPOSITORY } from '../../../data/magic-words-repository.port';

interface MagicWordDraft {
	id: string | null;
	type: MagicWordType;
	name: string;
	description: string;
	isActive: boolean;
	sortOrder: number;
	allowedGestureIds: string[];
	skillIds: string[];
	damageTypeIds: string[];
	conditionIds: string[];
	essenceProfile: MagicWordEssenceProfile;
	areaShape: MagicWordAreaShape;
}

type EssenceProfileField = keyof MagicWordEssenceProfile;
type AreaShapeBaseDimensionKey =
	| 'radius'
	| 'length'
	| 'width'
	| 'height'
	| 'side'
	| 'tiles'
	| 'innerRadius'
	| 'thickness';

interface SelectOption {
	id: string;
	name: string;
}

interface SelectOptionGroup {
	label: string;
	items: SelectOption[];
}

@Component({
	selector: 'app-admin-magic-words-page',
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
		MultiSelect,
		Select,
		Slider,
		Tag,
		Textarea,
		ToggleSwitch,
		Tooltip,
		EditorActionsBarComponent
	],
	templateUrl: './admin-magic-words-page.component.html',
	styleUrl: './admin-magic-words-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [ConfirmationService, UnsavedChangesGuard]
})
export class AdminMagicWordsPageComponent {
	private readonly repository = inject(MAGIC_WORDS_REPOSITORY);
	private readonly skillsRepository = inject(SKILLS_REPOSITORY);
	private readonly damageTypesRepository = inject(DAMAGE_TYPES_REPOSITORY);
	private readonly conditionsRepository = inject(CONDITIONS_REPOSITORY);
	private readonly confirmationService = inject(ConfirmationService);
	private readonly unsavedChangesGuard = inject(UnsavedChangesGuard);
	private readonly destroyRef = inject(DestroyRef);

	protected readonly breadcrumbs = [
		{ label: 'Правила системы' },
		{ label: 'Слова магии' }
	];
	protected readonly typeOptions = MAGIC_WORD_TYPE_OPTIONS;
	protected readonly essenceProfileFields: Array<{
		field: EssenceProfileField;
		label: string;
		tooltip: string;
	}> = [
		{
			field: 'damageAffinity',
			label: 'Урон',
			tooltip: 'Насколько сущность усиливает числовые формулы урона.'
		},
		{
			field: 'rangeAffinity',
			label: 'Дальность',
			tooltip: 'Насколько сущность подходит для формул расстояния и дальности действия.'
		},
		{
			field: 'controlAffinity',
			label: 'Контроль',
			tooltip: 'Насколько сущность подходит для точного управления, выбора целей и сложных воздействий.'
		},
		{
			field: 'durationAffinity',
			label: 'Длительность',
			tooltip: 'Насколько сущность поддерживает продолжительные эффекты.'
		},
		{
			field: 'areaAffinity',
			label: 'Область',
			tooltip: 'Насколько сущность подходит для расширения эффекта на область.'
		},
		{
			field: 'stabilityAffinity',
			label: 'Стабильность',
			tooltip: 'Насколько сущность подходит для устойчивых, защищённых и предсказуемых эффектов.'
		}
	];
	protected readonly areaShapeKindOptions: Array<{
		label: string;
		value: AreaShapeKind;
	}> = [
		{ label: 'Точка', value: 'POINT' },
		{ label: 'Линия', value: 'LINE' },
		{ label: 'Плоскость', value: 'PLANE' },
		{ label: 'Конус', value: 'CONE' },
		{ label: 'Сфера', value: 'SPHERE' },
		{ label: 'Куб', value: 'CUBE' },
		{ label: 'Цилиндр', value: 'CYLINDER' },
		{ label: 'Кольцо', value: 'RING' }
	];
	protected readonly selectedType = signal<MagicWordType>('ACTION');
	protected readonly selectedWordId = signal<string | null>(null);
	protected readonly searchQuery = signal('');
	protected readonly words = signal<MagicWord[]>([]);
	protected readonly skillCategories = signal<SkillCategory[]>([]);
	protected readonly skills = signal<Skill[]>([]);
	protected readonly damageTypes = signal<DamageType[]>([]);
	protected readonly conditions = signal<Condition[]>([]);
	protected readonly draft = signal<MagicWordDraft | null>(null);
	protected readonly savedDraftSignature = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly errorMessage = signal<string | null>(null);

	protected readonly hasChanges = computed(
		() => draftSignature(this.draft()) !== this.savedDraftSignature()
	);
	protected readonly selectedWord = computed(() => {
		const id = this.selectedWordId();
		return id ? this.words().find(word => word.id === id) ?? null : null;
	});
	protected readonly filteredWords = computed(() => {
		const query = this.searchQuery().trim().toLowerCase();
		return this.words()
			.filter(word => word.type === this.selectedType())
			.filter(word => {
				const haystack = `${word.name} ${word.description}`.toLowerCase();
				return !query || haystack.includes(query);
			})
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			});
	});
	protected readonly gestureOptions = computed(() =>
		this.words()
			.filter(word => word.type === 'GESTURE')
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			})
			.map(word => ({ id: word.id, name: word.name }))
	);
	protected readonly skillOptionGroups = computed<SelectOptionGroup[]>(() =>
		createSkillOptionGroups(this.skillCategories(), this.skills())
	);
	protected readonly damageTypeOptions = computed(() =>
		this.damageTypes()
			.filter(damageType => damageType.isActive)
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			})
			.map(damageType => ({ id: damageType.id, name: damageType.name }))
	);
	protected readonly conditionOptions = computed(() =>
		this.conditions()
			.filter(condition => condition.isActive)
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			})
			.map(condition => ({ id: condition.id, name: condition.name }))
	);
	protected readonly typeCounts = computed(() => {
		const counts = new Map<MagicWordType, number>();

		for (const option of this.typeOptions) {
			counts.set(option.value, 0);
		}

		for (const word of this.words()) {
			counts.set(word.type, (counts.get(word.type) ?? 0) + 1);
		}

		return counts;
	});
	protected readonly title = computed(() => {
		const draft = this.draft();
		return draft?.id
			? draft.name || 'Слово магии'
			: `Новое слово: ${magicWordTypeLabel(this.selectedType()).toLowerCase()}`;
	});
	protected readonly typeLabel = computed(() =>
		magicWordTypeLabel(this.draft()?.type ?? this.selectedType())
	);

	constructor() {
		this.loadWords();
	}

	protected setSearchQuery(query: string) {
		this.searchQuery.set(query);
	}

	protected selectType(type: MagicWordType) {
		if (type === this.selectedType()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				this.selectedType.set(type);
				this.selectFirstWord(type);
			}
		});
	}

	protected selectWord(word: MagicWord) {
		if (word.id === this.selectedWordId()) {
			return;
		}

		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => this.setDraftFromWord(word)
		});
	}

	protected createWord() {
		this.unsavedChangesGuard.confirmDiscard({
			hasChanges: this.hasChanges(),
			discard: () => this.resetDraft(),
			proceed: () => {
				const draft = createEmptyDraft(this.selectedType());
				this.selectedWordId.set(null);
				this.draft.set(draft);
				this.savedDraftSignature.set(draftSignature(draft));
			}
		});
	}

	protected updateDraftName(name: string) {
		this.patchDraft({ name });
	}

	protected updateDraftDescription(description: string) {
		this.patchDraft({ description });
	}

	protected updateDraftType(type: MagicWordType) {
		const allowedGestureIds =
			type === 'MODIFIER' ? this.draft()?.allowedGestureIds ?? [] : [];
		this.patchDraft({ type, allowedGestureIds });
	}

	protected updateDraftSortOrder(sortOrder: number | null) {
		this.patchDraft({ sortOrder: sortOrder ?? 0 });
	}

	protected updateDraftActive(isActive: boolean) {
		this.patchDraft({ isActive });
	}

	protected updateDraftAllowedGestures(allowedGestureIds: string[]) {
		this.patchDraft({ allowedGestureIds });
	}

	protected updateDraftSkills(skillIds: string[]) {
		this.patchDraft({ skillIds });
	}

	protected updateDraftDamageTypes(damageTypeIds: string[]) {
		this.patchDraft({ damageTypeIds });
	}

	protected updateDraftConditions(conditionIds: string[]) {
		this.patchDraft({ conditionIds });
	}

	protected updateEssenceProfileValue(
		field: EssenceProfileField,
		percentValue: number | null
	) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		this.patchDraft({
			essenceProfile: {
				...draft.essenceProfile,
				[field]: normalizePercent(percentValue)
			}
		});
	}

	protected updateAreaShape(patch: Partial<MagicWordAreaShape>) {
		const draft = this.draft();

		if (!draft) {
			return;
		}

		const nextKind = patch.kind ?? draft.areaShape.kind;
		const shouldResetDimensions = patch.kind && patch.kind !== draft.areaShape.kind;
		const shapeDefaults = createDefaultAreaShapeByKind(nextKind);

		this.patchDraft({
			areaShape: {
				...draft.areaShape,
				...(shouldResetDimensions
					? {
							...shapeDefaults,
							name: draft.areaShape.name,
							description: draft.areaShape.description,
							isActive: draft.areaShape.isActive,
							sortOrder: draft.areaShape.sortOrder
					  }
					: {}),
				...patch,
				dimensions: shouldResetDimensions
					? shapeDefaults.dimensions
					: patch.dimensions ?? draft.areaShape.dimensions,
				influenceConfig: shouldResetDimensions
					? shapeDefaults.influenceConfig
					: patch.influenceConfig ?? draft.areaShape.influenceConfig
			}
		});
	}

	protected essenceProfilePercent(
		profile: MagicWordEssenceProfile,
		field: EssenceProfileField
	) {
		return Math.round(profile[field] * 100);
	}

	protected resetDraft() {
		const word = this.selectedWord();

		if (word) {
			this.setDraftFromWord(word);
			return;
		}

		const draft = createEmptyDraft(this.selectedType());
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
			this.errorMessage.set('Название слова магии обязательно.');
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		const command = {
			type: draft.type,
			name,
			description: draft.description.trim(),
			isActive: draft.isActive,
			sortOrder: draft.sortOrder,
			allowedGestureIds:
				draft.type === 'MODIFIER' ? draft.allowedGestureIds : [],
			skillIds: draft.skillIds,
			damageTypeIds: draft.damageTypeIds,
			conditionIds: draft.conditionIds,
			essenceProfile:
				draft.type === 'ESSENCE' ? draft.essenceProfile : undefined,
			areaShape:
				draft.type === 'GESTURE' ? normalizeAreaShape(draft.areaShape) : undefined
		};
		const request = draft.id
			? this.repository.updateWord(draft.id, command)
			: this.repository.createWord(command);

		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: saved => {
				this.upsertWord(saved);
				this.selectedType.set(saved.type);
				this.setDraftFromWord(saved);
				this.saving.set(false);
			},
			error: error => {
				this.errorMessage.set(
					error instanceof Error ? error.message : 'Не удалось сохранить слово магии.'
				);
				this.saving.set(false);
			}
		});
	}

	protected deleteSelectedWord() {
		const word = this.selectedWord();

		if (!word || this.saving()) {
			return;
		}

		this.confirmationService.confirm({
			header: 'Удалить слово магии?',
			message: `«${word.name}» будет удалено из списка слов магии.`,
			acceptLabel: 'Удалить',
			rejectLabel: 'Отмена',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => this.deleteWord(word)
		});
	}

	protected typePluralLabel(type: MagicWordType) {
		return magicWordTypePluralLabel(type);
	}

	protected getTypeCount(type: MagicWordType) {
		return this.typeCounts().get(type) ?? 0;
	}

	private loadWords() {
		this.loading.set(true);
		this.errorMessage.set(null);

		forkJoin({
			magic: this.repository.loadCatalog(),
			skills: this.skillsRepository.loadAdminCatalog(),
			damageTypes: this.damageTypesRepository.loadCatalog(),
			conditions: this.conditionsRepository.loadCatalog()
		})
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: ({ magic, skills, damageTypes, conditions }) => {
					this.words.set(magic.words);
					this.skillCategories.set(skills.categories);
					this.skills.set(skills.skills);
					this.damageTypes.set(damageTypes.damageTypes);
					this.conditions.set(conditions.conditions);
					this.loading.set(false);
					this.selectFirstWord(this.selectedType());
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить слова магии.'
					);
					this.loading.set(false);
				}
			});
	}

	private selectFirstWord(type: MagicWordType) {
		const word = this.words()
			.filter(item => item.type === type)
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			})[0];

		if (word) {
			this.setDraftFromWord(word);
			return;
		}

		const draft = createEmptyDraft(type);
		this.selectedWordId.set(null);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private setDraftFromWord(word: MagicWord) {
		const draft: MagicWordDraft = {
			id: word.id,
			type: word.type,
			name: word.name,
			description: word.description,
			isActive: word.isActive,
			sortOrder: word.sortOrder,
			allowedGestureIds: [...word.allowedGestureIds],
			skillIds: [...word.skillIds],
			damageTypeIds: [...word.damageTypeIds],
			conditionIds: [...word.conditionIds],
			essenceProfile: word.essenceProfile
				? { ...word.essenceProfile }
				: createDefaultEssenceProfile(),
			areaShape: word.areaShape
				? { ...word.areaShape }
				: createDefaultAreaShape(word.name)
		};

		this.selectedWordId.set(word.id);
		this.draft.set(draft);
		this.savedDraftSignature.set(draftSignature(draft));
	}

	private patchDraft(patch: Partial<MagicWordDraft>) {
		this.draft.update(draft => (draft ? { ...draft, ...patch } : draft));
	}

	private upsertWord(word: MagicWord) {
		this.words.update(words => {
			const index = words.findIndex(item => item.id === word.id);

			if (index === -1) {
				return [...words, word];
			}

			const next = [...words];
			next[index] = word;
			return next;
		});
	}

	private deleteWord(word: MagicWord) {
		this.saving.set(true);
		this.errorMessage.set(null);

		this.repository
			.deleteWord(word.id)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => {
					this.words.update(words => words.filter(item => item.id !== word.id));
					this.saving.set(false);
					this.selectFirstWord(word.type);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error ? error.message : 'Не удалось удалить слово магии.'
					);
					this.saving.set(false);
				}
			});
	}
}

function createEmptyDraft(type: MagicWordType): MagicWordDraft {
	return {
		id: null,
		type,
		name: '',
		description: '',
		isActive: true,
		sortOrder: 0,
		allowedGestureIds: [],
		skillIds: [],
		damageTypeIds: [],
		conditionIds: [],
		essenceProfile: createDefaultEssenceProfile(),
		areaShape: createDefaultAreaShape('')
	};
}

function createSkillOptionGroups(
	categories: SkillCategory[],
	skills: Skill[]
): SelectOptionGroup[] {
	const activeSkills = skills.filter(skill => skill.isActive);
	const activeCategoryIds = new Set(
		categories.filter(category => category.isActive).map(category => category.id)
	);
	const groups = categories
		.filter(category => category.isActive)
		.sort((first, second) => first.name.localeCompare(second.name, 'ru'))
		.map(category => ({
			label: category.name,
			items: activeSkills
				.filter(skill => skill.categoryId === category.id)
				.sort((first, second) => first.name.localeCompare(second.name, 'ru'))
				.map(skill => ({ id: skill.id, name: skill.name }))
		}))
		.filter(group => group.items.length > 0);
	const uncategorized = activeSkills
		.filter(skill => !activeCategoryIds.has(skill.categoryId))
		.sort((first, second) => first.name.localeCompare(second.name, 'ru'))
		.map(skill => ({ id: skill.id, name: skill.name }));

	return uncategorized.length
		? [...groups, { label: 'Без категории', items: uncategorized }]
		: groups;
}

function draftSignature(draft: MagicWordDraft | null): string {
	return JSON.stringify(draft ?? null);
}

function createDefaultEssenceProfile(): MagicWordEssenceProfile {
	return {
		damageAffinity: 0.5,
		rangeAffinity: 0.5,
		controlAffinity: 0.5,
		durationAffinity: 0.5,
		areaAffinity: 0.5,
		stabilityAffinity: 0.5
	};
}

function normalizePercent(value: number | null) {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		return 0;
	}

	return Math.min(1, Math.max(0, Math.round(value) / 100));
}

function createDefaultAreaShape(name: string): MagicWordAreaShape {
	return {
		...createDefaultAreaShapeByKind('POINT'),
		name: name || 'Форма области'
	};
}

function createDefaultAreaShapeByKind(kind: AreaShapeKind): MagicWordAreaShape {
	const defaults = areaShapeDimensionDefaults(kind);

	return {
		kind,
		name: 'Форма области',
		description: '',
		dimensions: {
			version: 1,
			primaryDimension: defaults.primaryDimension,
			unit: 'cell',
			base: defaults.base
		},
		influenceConfig: {
			version: 1,
			sources: []
		},
		isActive: true,
		sortOrder: 0
	};
}

function areaShapeDimensionDefaults(kind: AreaShapeKind): {
	primaryDimension: AreaShapeBaseDimensionKey | '';
	base: Partial<Record<AreaShapeBaseDimensionKey, number>>;
} {
	switch (kind) {
		case 'POINT':
			return { primaryDimension: '', base: {} };
		case 'LINE':
			return { primaryDimension: 'length', base: { length: 5, width: 1 } };
		case 'PLANE':
			return { primaryDimension: 'tiles', base: { tiles: 4 } };
		case 'CONE':
			return { primaryDimension: 'length', base: { length: 4 } };
		case 'SPHERE':
			return { primaryDimension: 'radius', base: { radius: 2 } };
		case 'CUBE':
			return { primaryDimension: 'side', base: { side: 3 } };
		case 'CYLINDER':
			return { primaryDimension: 'radius', base: { radius: 2, height: 4 } };
		case 'RING':
			return { primaryDimension: 'innerRadius', base: { innerRadius: 1, thickness: 2 } };
	}
}

function normalizeAreaShape(shape: MagicWordAreaShape): MagicWordAreaShape {
	const defaults = createDefaultAreaShapeByKind(shape.kind);

	return {
		...shape,
		name: shape.name.trim() || 'Форма области',
		description: shape.description.trim(),
		dimensions: {
			version: 1,
			primaryDimension:
				shape.dimensions.primaryDimension || defaults.dimensions.primaryDimension,
			unit: 'cell',
			base: { ...defaults.dimensions.base }
		},
		influenceConfig: {
			version: 1,
			sources: []
		}
	};
}
