import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
	signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	Creature,
	CreatureCharacteristicOption
} from '../../../../../../creatures/domain/creatures.models';
import { ProgressionPreset } from '../../../../../../progression-presets/domain/progression-presets.models';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import {
	Skill,
	SkillLevel
} from '../../../../../../skills/domain/skills.models';
import { SpellMechanic } from '../../../../../../spell-mechanics/domain/spell-mechanics.models';
import { SystemValue } from '../../../../../../values/domain/values.models';
import { SpellDraft, TagSeverity } from '../../models/spell-detail-page.types';
import { formatPreviewNumber } from '../../utils/spell-numeric-parameter.utils';
import {
	BalanceAxisPoint,
	BalanceCasterAxis,
	analyzeSpellDamageBalance
} from './spell-damage-balance-analyzer';

interface CreatureOption {
	label: string;
	value: string;
	searchText: string;
}

interface BalanceTierMatrix {
	tier: number;
	name: string;
	hp: number;
	armor: string;
	defense: string;
	rows: BalanceMatrixRow[];
}

interface BalanceMatrixRow {
	id: string;
	groupKey: number;
	groupStateKey: string;
	groupLabel: string;
	groupSortValue: number;
	points: BalanceAxisPoint[];
	cells: BalanceMatrixCell[];
}

interface BalanceMatrixCell {
	columnValue: number;
	damage: number | null;
	damageShare: number | null;
	severity: TagSeverity;
	summary: string;
	percentLabel: string;
	detailTitle: string;
	details: string[];
}

interface SelectedBalanceCell {
	title: string;
	severity: TagSeverity;
	summary: string;
	details: string[];
}

@Component({
	selector: 'app-spell-balance-tab',
	standalone: true,
	imports: [FormsModule, Button, Dialog, Select, TableModule, Tag],
	templateUrl: './spell-balance-tab.component.html',
	styleUrl: './spell-balance-tab.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellBalanceTabComponent {
	readonly draft = input.required<SpellDraft>();
	readonly mechanics = input.required<SpellMechanic[]>();
	readonly creatures = input.required<Creature[]>();
	readonly characteristics = input.required<CreatureCharacteristicOption[]>();
	readonly skills = input.required<Skill[]>();
	readonly skillLevels = input.required<SkillLevel[]>();
	readonly progressionPresets = input.required<ProgressionPreset[]>();
	readonly systemValues = input.required<SystemValue[]>();

	protected readonly selectedCreatureId = signal<string | null>(null);
	protected readonly selectedCell = signal<SelectedBalanceCell | null>(null);
	protected readonly expandedGroupKeys = signal<Set<string>>(new Set());
	protected readonly creatureOptions = computed<CreatureOption[]>(() =>
		this.creatures()
			.filter(creature => creature.isActive)
			.sort((first, second) => {
				const orderDiff = first.sortOrder - second.sortOrder;
				return orderDiff || first.name.localeCompare(second.name, 'ru');
			})
			.map(creature => ({
				label: creature.name,
				value: creature.id,
				searchText: `${creature.name} ${creature.type.name}`
			}))
	);
	protected readonly selectedCreature = computed(() => {
		const id = this.selectedCreatureId() ?? this.creatureOptions()[0]?.value;
		return id
			? (this.creatures().find(creature => creature.id === id) ?? null)
			: null;
	});
	protected readonly balanceAnalysis = computed(() =>
		analyzeSpellDamageBalance({
			draft: this.draft(),
			mechanics: this.mechanics(),
			skills: this.skills(),
			characteristics: this.characteristics(),
			skillLevels: this.skillLevels(),
			progressionPresets: this.progressionPresets(),
			systemValues: this.systemValues()
		})
	);
	protected readonly rowAxes = computed(() => this.balanceAnalysis().rowAxes);
	protected readonly columnAxis = computed(
		() => this.balanceAnalysis().columnAxis
	);
	protected readonly columnValues = computed(
		() => this.columnAxis()?.values ?? [0]
	);
	protected readonly balanceMatrices = computed<BalanceTierMatrix[]>(() => {
		const creature = this.selectedCreature();

		if (!creature) {
			return [];
		}

		const analysis = this.balanceAnalysis();
		const defenseSkill = analysis.defenseSkill;
		const hasAttackDiceSource =
			!!analysis.attackSkill?.rollCharacteristicId &&
			this.characteristics().some(
				characteristic =>
					characteristic.id === analysis.attackSkill?.rollCharacteristicId
			);
		const rowPointSets = axisPointSets(analysis.rowAxes);

		return [...creature.tiers]
			.sort((first, second) => first.tier - second.tier)
			.map(tier => {
				const defenseTierSkill = defenseSkill
					? tier.skills.find(skill => skill.skillId === defenseSkill.id)
					: null;
				const absorbed = tier.armorPreset ? tier.armorPreset.protection : 0;
				const defenseSkillLevel = defenseTierSkill?.level ?? null;
				const defenseDice =
					defenseSkill?.rollCharacteristicId === null ||
					defenseSkill?.rollCharacteristicId === undefined
						? null
						: (tier.characteristics.find(
								characteristic =>
									characteristic.characteristicId ===
									defenseSkill.rollCharacteristicId
							)?.value ?? null);
				const armor = tier.armorPreset
					? `${tier.armorPreset.name}: ${tier.armorPreset.points} x ${tier.armorPreset.protection}`
					: 'Без брони';
				const defense = defenseSkill
					? defenseTierSkill
						? `${defenseSkill.name} ${defenseTierSkill.level}`
						: `${defenseSkill.name}: нет`
					: 'Не найден защитный навык';
				const rows = rowPointSets.map(points => {
					const attackDicePoint = points.find(
						point => point.axis.kind === 'attackDice'
					);
					const groupKey = attackDicePoint
						? attackDicePoint.value
						: 0;
					const groupStateKey = `${tier.tier}:${groupKey}`;
					const groupLabel = attackDicePoint
						? `${attackDicePoint.axis.label}: ${attackDicePoint.value}`
						: 'Параметры';

					return {
						id: `${tier.id}:${points.map(point => `${point.axis.id}:${point.value}`).join(':')}`,
						groupKey,
						groupStateKey,
						groupLabel,
						groupSortValue: groupKey,
						points,
						cells: this.columnValues().map(columnValue => {
							const axisValues = new Map(
								points.map(point => [point.axis.id, point.value] as const)
							);

							if (analysis.columnAxis) {
								axisValues.set(analysis.columnAxis.id, columnValue);
							}

							const damage =
								!hasAttackDiceSource ||
								defenseSkillLevel === null ||
								defenseDice === null
									? null
									: analysis.evaluateDamage({
											axisValues,
											defenseSkillLevel,
											defenseDice,
											absorbed
										});
							const damageShare =
								damage === null ? null : damage / Math.max(1, tier.hp);
							const percentLabel =
								damageShare === null
									? '—'
									: `${(damageShare * 100).toFixed(0)}%`;
							const columnPoint = analysis.columnAxis
								? {
										axis: analysis.columnAxis,
										value: columnValue
									}
								: null;
							const detailPoints = columnPoint
								? [...points, columnPoint]
								: points;

							return {
								columnValue,
								damage,
								damageShare,
								severity: damageShareSeverity(damageShare),
								summary: damageShareSummary(damageShare),
								percentLabel,
								detailTitle: `${tier.tier}. ${tier.name}`,
								details: [
									`HP: ${tier.hp}`,
									`Броня: ${armor}`,
									`Защита: ${defense}`,
									...detailPoints.map(
										point => `${point.axis.label}: ${point.value}`
									),
									damage === null
										? 'Урон: нет данных'
										: `Ожидаемый урон: ${formatPreviewNumber(damage)}`,
									damageShare === null
										? 'Доля HP: нет данных'
										: `Доля HP: ${(damageShare * 100).toFixed(0)}% от здоровья тира`
								]
							};
						})
					};
				}).sort(compareBalanceRows);

				return {
					tier: tier.tier,
					name: tier.name,
					hp: tier.hp,
					armor,
					defense,
					rows
				};
			});
	});
	protected readonly damageLabel = computed(() =>
		this.balanceAnalysis().damageParameters.length
			? this.balanceAnalysis()
					.damageParameters.map(item => item.parameter.name)
					.join(', ')
			: 'Параметры урона не найдены'
	);
	protected readonly defenseLabel = computed(
		() =>
			this.balanceAnalysis().defenseSkill?.name ?? 'Защитный навык не найден'
	);
	protected readonly attackLabel = computed(() => {
		const attackSkill = this.balanceAnalysis().attackSkill;

		if (!attackSkill) {
			return 'Навык атаки не найден';
		}

		return attackSkill.rollCharacteristicId
			? attackSkill.name
			: `${attackSkill.name}: нет характеристики броска`;
	});

	protected updateSelectedCreature(creatureId: string | null) {
		this.selectedCreatureId.set(creatureId);
		this.expandedGroupKeys.set(new Set());
	}

	protected showCellDetails(cell: BalanceMatrixCell) {
		this.selectedCell.set({
			title: cell.detailTitle,
			severity: cell.severity,
			summary: cell.summary,
			details: cell.details
		});
	}

	protected closeCellDetails() {
		this.selectedCell.set(null);
	}

	protected isGroupExpanded(groupStateKey: string): boolean {
		return this.expandedGroupKeys().has(groupStateKey);
	}

	protected toggleGroupExpanded(groupStateKey: string) {
		this.expandedGroupKeys.update(keys => {
			const next = new Set(keys);

			if (next.has(groupStateKey)) {
				next.delete(groupStateKey);
				return next;
			}

			next.add(groupStateKey);
			return next;
		});
	}
}

function compareBalanceRows(first: BalanceMatrixRow, second: BalanceMatrixRow) {
	const groupDiff = first.groupSortValue - second.groupSortValue;

	if (groupDiff !== 0) {
		return groupDiff;
	}

	for (
		let pointIndex = 0;
		pointIndex < Math.min(first.points.length, second.points.length);
		pointIndex += 1
	) {
		const valueDiff =
			first.points[pointIndex].value - second.points[pointIndex].value;

		if (valueDiff !== 0) {
			return valueDiff;
		}
	}

	return first.points.length - second.points.length;
}

function damageShareSeverity(share: number | null): TagSeverity {
	if (share === null) {
		return 'secondary';
	}

	if (share >= 1) {
		return 'danger';
	}

	if (share >= 0.5) {
		return 'warn';
	}

	if (share >= 0.25) {
		return 'info';
	}

	return 'secondary';
}

function damageShareSummary(share: number | null): string {
	if (share === null) {
		return 'нет данных';
	}

	if (share >= 1) {
		return 'ваншот';
	}

	if (share >= 0.5) {
		return 'сильно';
	}

	if (share >= 0.25) {
		return 'заметно';
	}

	return 'слабо';
}

function axisPointSets(axes: BalanceCasterAxis[]): BalanceAxisPoint[][] {
	return axes.reduce<BalanceAxisPoint[][]>(
		(sets, axis) =>
			sets.flatMap(set =>
				axis.values.map(value => [
					...set,
					{
						axis,
						value
					}
				])
			),
		[[]]
	);
}
