import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Breadcrumb } from 'primeng/breadcrumb';
import { Button } from 'primeng/button';
import { InputNumber } from 'primeng/inputnumber';
import { Tag } from 'primeng/tag';
import {
	Attribute,
	Characteristic
} from '../../../../attributes/domain/attributes.models';
import {
	Skill,
	SkillCategory,
	SkillLevel
} from '../../../../skills/domain/skills.models';
import {
	CHARACTER_INPUT_OVERRIDE_KEY,
	evaluateGraph,
	formatNumber
} from '../../../../values/domain/value-graph.engine';
import { SystemValue } from '../../../../values/domain/values.models';
import { CharacterSheetSandboxRoll } from '../../../domain/character-sheet-sandbox.models';
import { AdminCharacterSheetFacade } from '../../../state/admin-character-sheet.facade';

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
	selector: 'app-admin-character-sheet-page',
	standalone: true,
	imports: [CommonModule, FormsModule, Breadcrumb, Button, InputNumber, Tag],
	templateUrl: './admin-character-sheet-page.component.html',
	styleUrl: './admin-character-sheet-page.component.scss'
})
export class AdminCharacterSheetPageComponent {
	private readonly destroyRef = inject(DestroyRef);
	private readonly facade = inject(AdminCharacterSheetFacade);

	protected readonly breadcrumbs = [
		{ label: 'Песочница' },
		{ label: 'Лист персонажа' }
	];
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
	protected readonly hasChanges = computed(
		() => !areInputValuesEqual(this.inputValues(), this.savedInputValues())
	);
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
		const categories = this.skillCategories().filter(category => category.isActive);
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
	protected readonly consequenceValues = computed(() =>
		this.systemValues()
			.filter(
				value =>
					(value.kind === 'roll-consequence' && value.primaryOwner.id) ||
					value.kind === 'manual'
			)
			.map(value => ({
				value,
				calculated: this.getCalculatedValue(value.id)
			}))
	);

	constructor() {
		this.loadCatalogs();
	}

	protected setInputValue(systemValueId: string, value: number | null) {
		this.inputValues.update(current => ({
			...current,
			[systemValueId]: value ?? 0
		}));
	}

	protected saveDraft() {
		if (this.saving() || !this.hasChanges()) {
			return;
		}

		this.saving.set(true);
		this.errorMessage.set(null);

		this.facade
			.saveDraft(this.inputValues())
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: draft => {
					const nextValues = {
						...this.createDefaultInputValues(),
						...draft.inputValues
					};
					this.inputValues.set(nextValues);
					this.savedInputValues.set(nextValues);
					this.saving.set(false);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось сохранить лист персонажа.'
					);
					this.saving.set(false);
				}
			});
	}

	protected resetDraft() {
		this.inputValues.set({ ...this.savedInputValues() });
	}

	protected clearDraft() {
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
		if (this.rollingSkillId()) {
			return;
		}

		this.rollingSkillId.set(skill.id);
		this.errorMessage.set(null);

		this.facade
			.rollSkill(skill.id, this.inputValues())
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
			this.skillsCatalogConsequences().get(skill.rollConsequenceId) ??
			'Последствие не найдено'
		);
	}

	protected formatValue(value: number) {
		return formatNumber(value);
	}

	private readonly skillsCatalogConsequences = computed(() => {
		const map = new Map<string, string>();
		const catalog = this.skillsCatalogRollConsequences();

		for (const consequence of catalog) {
			map.set(consequence.id, consequence.name);
		}

		return map;
	});
	private readonly skillsCatalogRollConsequences = signal<
		Array<{ id: string; name: string }>
	>([]);

	private loadCatalogs() {
		this.loading.set(true);
		this.errorMessage.set(null);

		this.facade
			.loadPageData()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: data => {
					this.attributes.set(data.attributes);
					this.characteristics.set(data.characteristics);
					this.skillCategories.set(data.skillCategories);
					this.skills.set(data.skills);
					this.skillLevels.set(data.skillLevels);
					this.systemValues.set(data.systemValues);
					this.skillsCatalogRollConsequences.set(data.rollConsequences);
					this.initializeInputValues(data.draft.inputValues);
					this.loading.set(false);
				},
				error: error => {
					this.errorMessage.set(
						error instanceof Error
							? error.message
							: 'Не удалось загрузить лист персонажа.'
					);
					this.loading.set(false);
				}
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
