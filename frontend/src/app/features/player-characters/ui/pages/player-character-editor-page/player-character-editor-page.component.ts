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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { InputNumber } from 'primeng/inputnumber';
import { InputText } from 'primeng/inputtext';
import { Tag } from 'primeng/tag';
import { EMPTY, catchError, finalize, forkJoin } from 'rxjs';
import {
	Attribute,
	Characteristic
} from '../../../../attributes/domain/attributes.models';
import {
	ATTRIBUTES_REPOSITORY,
	AttributesRepository
} from '../../../../attributes/data/attributes-repository.port';
import { CharacterSheetSandboxRoll } from '../../../../character-sheet/domain/character-sheet-sandbox.models';
import {
	Skill,
	SkillCategory,
	SkillLevel
} from '../../../../skills/domain/skills.models';
import {
	SKILLS_REPOSITORY,
	SkillsRepository
} from '../../../../skills/data/skills-repository.port';
import {
	CHARACTER_INPUT_OVERRIDE_KEY,
	evaluateGraph,
	formatNumber
} from '../../../../values/domain/value-graph.engine';
import { SystemValue } from '../../../../values/domain/values.models';
import {
	VALUES_REPOSITORY,
	ValuesRepository
} from '../../../../values/data/values-repository.port';
import { PLAYER_CHARACTERS_REPOSITORY } from '../../../data/player-characters-repository.port';
import { PlayerCharacter } from '../../../domain/player-characters.models';

interface AttributeBlock {
	attribute: Attribute;
	value: number;
	characteristics: Array<{
		characteristic: Characteristic;
		value: number;
	}>;
}

interface SkillGroup {
	category: SkillCategory | null;
	skills: Skill[];
}

@Component({
	selector: 'app-player-character-editor-page',
	imports: [FormsModule, Button, InputNumber, InputText, RouterLink, Tag],
	templateUrl: './player-character-editor-page.component.html',
	styleUrl: './player-character-editor-page.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayerCharacterEditorPageComponent {
	private readonly destroyRef = inject(DestroyRef);
	private readonly route = inject(ActivatedRoute);
	private readonly charactersRepository = inject(PLAYER_CHARACTERS_REPOSITORY);
	private readonly attributesRepository = inject<AttributesRepository>(
		ATTRIBUTES_REPOSITORY
	);
	private readonly skillsRepository =
		inject<SkillsRepository>(SKILLS_REPOSITORY);
	private readonly valuesRepository =
		inject<ValuesRepository>(VALUES_REPOSITORY);

	protected readonly character = signal<PlayerCharacter | null>(null);
	protected readonly name = signal('');
	protected readonly loading = signal(true);
	protected readonly saving = signal(false);
	protected readonly rollingSkillId = signal<string | null>(null);
	protected readonly errorMessage = signal<string | null>(null);
	protected readonly attributes = signal<Attribute[]>([]);
	protected readonly characteristics = signal<Characteristic[]>([]);
	protected readonly skillCategories = signal<SkillCategory[]>([]);
	protected readonly skills = signal<Skill[]>([]);
	protected readonly skillLevels = signal<SkillLevel[]>([]);
	protected readonly systemValues = signal<SystemValue[]>([]);
	protected readonly inputValues = signal<Record<string, number>>({});
	protected readonly savedInputValues = signal<Record<string, number>>({});
	protected readonly lastRoll = signal<CharacterSheetSandboxRoll | null>(null);
	protected readonly hasChanges = computed(() => {
		const character = this.character();

		return (
			!!character &&
			(character.name !== this.name().trim() ||
				!areInputValuesEqual(this.inputValues(), this.savedInputValues()))
		);
	});
	protected readonly activeAttributes = computed(() =>
		this.attributes().filter(attribute => attribute.isActive)
	);
	protected readonly activeCharacteristics = computed(() =>
		this.characteristics().filter(characteristic => characteristic.isActive)
	);
	protected readonly activeSkills = computed(() =>
		this.skills().filter(skill => skill.isActive)
	);
	protected readonly skillGroups = computed<SkillGroup[]>(() => {
		const categories = this.skillCategories().filter(
			category => category.isActive
		);
		const activeSkills = this.activeSkills();
		const groups = categories
			.map(category => ({
				category,
				skills: activeSkills.filter(skill => skill.categoryId === category.id)
			}))
			.filter(group => group.skills.length > 0);
		const categoryIds = new Set(categories.map(category => category.id));
		const uncategorizedSkills = activeSkills.filter(
			skill => !categoryIds.has(skill.categoryId)
		);

		return uncategorizedSkills.length
			? [...groups, { category: null, skills: uncategorizedSkills }]
			: groups;
	});
	protected readonly valueById = computed(() => {
		const map = new Map<string, SystemValue>();

		for (const value of this.systemValues()) {
			map.set(value.id, value);
		}

		return map;
	});
	protected readonly attributeBlocks = computed<AttributeBlock[]>(() =>
		this.activeAttributes().map(attribute => ({
			attribute,
			value: this.getCalculatedValue(attribute.systemValue.id),
			characteristics: this.activeCharacteristics()
				.filter(characteristic => characteristic.attributeId === attribute.id)
				.map(characteristic => ({
					characteristic,
					value: this.getCalculatedValue(characteristic.systemValue.id)
				}))
		}))
	);
	protected readonly resourceValues = computed(() =>
		this.systemValues()
			.filter(
				value =>
					(value.kind === 'roll-consequence' && value.primaryOwner.id) ||
					value.kind === 'manual'
			)
			.map(value => ({
				value,
				calculated: this.getCalculatedValue(value.id),
				isEditable: this.isEditableResourceValue(value)
			}))
	);

	private readonly rollConsequences = signal<
		Array<{ id: string; name: string }>
	>([]);
	private readonly rollConsequenceNames = computed(() => {
		const map = new Map<string, string>();

		for (const consequence of this.rollConsequences()) {
			map.set(consequence.id, consequence.name);
		}

		return map;
	});

	constructor() {
		const id = this.route.snapshot.paramMap.get('id');

		if (id) {
			this.loadCharacterSheet(id);
		} else {
			this.loading.set(false);
			this.errorMessage.set('Персонаж не найден.');
		}
	}

	protected setInputValue(systemValueId: string, value: number | null) {
		this.inputValues.update(current => ({
			...current,
			[systemValueId]: value ?? 0
		}));
	}

	protected save() {
		const character = this.character();
		const name = this.name().trim();

		if (!character || !name) {
			this.errorMessage.set('Имя персонажа обязательно.');
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		forkJoin({
			character: this.charactersRepository.updateCharacter(character.id, {
				name
			}),
			sheet: this.charactersRepository.updateSheet(
				character.id,
				this.inputValues()
			)
		})
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось сохранить персонажа.'
					);
					return EMPTY;
				}),
				finalize(() => this.saving.set(false)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(({ character: updatedCharacter, sheet }) => {
				const nextValues = {
					...this.createDefaultInputValues(),
					...sheet.inputValues
				};
				this.character.set(updatedCharacter);
				this.name.set(updatedCharacter.name);
				this.inputValues.set(nextValues);
				this.savedInputValues.set(nextValues);
			});
	}

	protected resetDraft() {
		const character = this.character();

		if (character) {
			this.name.set(character.name);
		}

		this.inputValues.set({ ...this.savedInputValues() });
	}

	protected clearSheet() {
		this.inputValues.set(this.createDefaultInputValues());
	}

	protected getInputValue(systemValueId: string) {
		return this.inputValues()[systemValueId] ?? 0;
	}

	protected getCalculatedValue(systemValueId: string) {
		const value = this.valueById().get(systemValueId);

		if (!value?.calculationGraph) {
			return this.getInputValue(systemValueId);
		}

		return evaluateGraph(value.calculationGraph, this.systemValues(), {
			...this.inputValues(),
			[CHARACTER_INPUT_OVERRIDE_KEY]: this.getInputValue(systemValueId)
		}).finalBase;
	}

	protected rollSkill(skill: Skill) {
		const character = this.character();

		if (!character || this.rollingSkillId()) {
			return;
		}

		this.rollingSkillId.set(skill.id);
		this.errorMessage.set(null);

		this.charactersRepository
			.rollSkill(character.id, skill.id, this.inputValues())
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: result => {
					const nextValues = {
						...this.createDefaultInputValues(),
						...result.inputValues
					};
					this.inputValues.set(nextValues);
					this.savedInputValues.set(nextValues);
					this.lastRoll.set(result.roll);
					this.rollingSkillId.set(null);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось выполнить бросок.'
					);
					this.rollingSkillId.set(null);
				}
			});
	}

	protected getSkillConsequenceName(skill: Skill) {
		if (!skill.rollConsequenceId) {
			return 'Без последствий';
		}

		return (
			this.rollConsequenceNames().get(skill.rollConsequenceId) ??
			'Последствие не найдено'
		);
	}

	protected formatValue(value: number) {
		return formatNumber(value);
	}

	protected isEditableResourceValue(value: SystemValue) {
		return value.kind === 'manual' && hasCharacterInput(value);
	}

	private loadCharacterSheet(id: string) {
		this.loading.set(true);
		this.errorMessage.set(null);

		forkJoin({
			character: this.charactersRepository.loadCharacter(id),
			sheet: this.charactersRepository.loadSheet(id),
			attributes: this.attributesRepository.loadAdminCatalog(),
			skills: this.skillsRepository.loadAdminCatalog(),
			values: this.valuesRepository.loadCatalog()
		})
			.pipe(
				catchError(error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить персонажа.'
					);
					return EMPTY;
				}),
				finalize(() => this.loading.set(false)),
				takeUntilDestroyed(this.destroyRef)
			)
			.subscribe(({ character, sheet, attributes, skills, values }) => {
				this.character.set(character);
				this.name.set(character.name);
				this.attributes.set(attributes.attributes);
				this.characteristics.set(attributes.characteristics);
				this.skillCategories.set(skills.categories);
				this.skills.set(skills.skills);
				this.skillLevels.set(skills.levels);
				this.systemValues.set(values.values);
				this.rollConsequences.set(
					skills.rollConsequences.map(consequence => ({
						id: consequence.id,
						name: consequence.name
					}))
				);
				this.initializeInputValues(sheet.inputValues);
			});
	}

	private initializeInputValues(savedValues: Record<string, number>) {
		const nextValues = {
			...this.createDefaultInputValues(),
			...savedValues
		};

		this.inputValues.set(nextValues);
		this.savedInputValues.set(nextValues);
	}

	private createDefaultInputValues() {
		const nextValues: Record<string, number> = {};

		for (const attribute of this.attributes()) {
			nextValues[attribute.systemValue.id] = 0;
		}

		for (const characteristic of this.characteristics()) {
			nextValues[characteristic.systemValue.id] = characteristic.defaultValue;
		}

		for (const skill of this.skills()) {
			nextValues[skill.systemValue.id] = skill.defaultLevel;
		}

		for (const value of this.systemValues()) {
			if (value.kind === 'roll-consequence' || value.kind === 'manual') {
				nextValues[value.id] = value.baseValue;
			}
		}

		return nextValues;
	}
}

function hasCharacterInput(value: SystemValue) {
	if (!value.calculationGraph) {
		return true;
	}

	return value.calculationGraph.nodes.some(
		node => node.kind === 'characterInput'
	);
}

function areInputValuesEqual(
	left: Record<string, number>,
	right: Record<string, number>
) {
	const leftKeys = Object.keys(left).sort();
	const rightKeys = Object.keys(right).sort();

	if (leftKeys.length !== rightKeys.length) {
		return false;
	}

	return leftKeys.every((key, index) => {
		const rightKey = rightKeys[index];
		return key === rightKey && left[key] === right[rightKey];
	});
}
