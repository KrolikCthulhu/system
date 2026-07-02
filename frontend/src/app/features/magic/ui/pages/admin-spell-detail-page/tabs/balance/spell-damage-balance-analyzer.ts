import { ProgressionPreset } from '../../../../../../progression-presets/domain/progression-presets.models';
import { CreatureCharacteristicOption } from '../../../../../../creatures/domain/creatures.models';
import {
	Skill,
	SkillLevel
} from '../../../../../../skills/domain/skills.models';
import {
	SpellMechanic,
	SpellMechanicParameter
} from '../../../../../../spell-mechanics/domain/spell-mechanics.models';
import { MechanicCalculationGraphState } from '../../../../../../spell-mechanics/ui/mechanic-calculation-graph.models';
import { SystemValue } from '../../../../../../values/domain/values.models';
import {
	SpellDraft,
	SpellMechanicBlockDraft
} from '../../models/spell-detail-page.types';
import {
	SpellAutoParameterValue,
	SpellFormulaParameterValue,
	SpellParameterValue,
	SpellProgressionParameterValue,
	evaluateAutoParameterValue,
	evaluateRoundedProgression,
	isAutoParameterValue,
	isFormulaParameterValue,
	isProgressionParameterValue,
	isStaticParameterValue
} from '../../utils/spell-numeric-parameter.utils';

export type BalanceCasterAxisKind =
	| 'attackDice'
	| 'skillLevel'
	| 'casterLevel'
	| 'numeric';

export interface BalanceCasterAxis {
	id: string;
	label: string;
	kind: BalanceCasterAxisKind;
	values: number[];
	preferredColumn: boolean;
}

export interface BalanceDamageParameter {
	block: SpellMechanicBlockDraft;
	parameter: SpellMechanicParameter;
	value: SpellParameterValue | null;
}

export interface BalanceSkillSource {
	id: string;
	name: string;
	rollCharacteristicId: string | null;
	parameter: SpellMechanicParameter;
}

export interface BalanceAxisPoint {
	axis: BalanceCasterAxis;
	value: number;
}

export interface SpellDamageBalanceAnalysis {
	damageParameters: BalanceDamageParameter[];
	casterAxes: BalanceCasterAxis[];
	rowAxes: BalanceCasterAxis[];
	columnAxis: BalanceCasterAxis | null;
	attackSkill: BalanceSkillSource | null;
	defenseSkill: BalanceSkillSource | null;
	evaluateDamage(context: BalanceDamageEvaluationContext): number;
}

export interface BalanceDamageEvaluationContext {
	axisValues: ReadonlyMap<string, number>;
	defenseSkillLevel: number;
	defenseDice: number;
	absorbed: number;
}

export interface SpellDamageBalanceAnalyzerInput {
	draft: SpellDraft;
	mechanics: SpellMechanic[];
	skills: Skill[];
	characteristics: CreatureCharacteristicOption[];
	skillLevels: SkillLevel[];
	progressionPresets: ProgressionPreset[];
	systemValues: SystemValue[];
}

type SuccessDistribution = Map<number, number>;

export function analyzeSpellDamageBalance(
	input: SpellDamageBalanceAnalyzerInput
): SpellDamageBalanceAnalysis {
	const analyzer = new SpellDamageBalanceAnalyzer(input);
	return analyzer.analyze();
}

class SpellDamageBalanceAnalyzer {
	private readonly input: SpellDamageBalanceAnalyzerInput;
	private readonly axes = new Map<string, BalanceCasterAxis>();
	private readonly damageParameters: BalanceDamageParameter[];
	private readonly attackSkill: BalanceSkillSource | null;
	private readonly defenseSkill: BalanceSkillSource | null;

	constructor(input: SpellDamageBalanceAnalyzerInput) {
		this.input = input;
		this.damageParameters = this.collectDamageParameters();
		this.attackSkill = this.skillFromParameter(isAttackSkillParameter);
		this.defenseSkill = this.skillFromParameter(isDefenseSkillParameter);
	}

	analyze(): SpellDamageBalanceAnalysis {
		this.addAttackAxes();
		this.addDamageSourceAxes();

		const casterAxes = Array.from(this.axes.values());
		const columnAxis =
			casterAxes.find(axis => axis.preferredColumn) ??
			casterAxes.find(axis => axis.kind === 'skillLevel') ??
			null;
		const rowAxes = casterAxes.filter(axis => axis.id !== columnAxis?.id);

		return {
			damageParameters: this.damageParameters,
			casterAxes,
			rowAxes,
			columnAxis,
			attackSkill: this.attackSkill,
			defenseSkill: this.defenseSkill,
			evaluateDamage: context => this.evaluateDamage(context)
		};
	}

	private addAttackAxes() {
		this.addAxis({
			id: attackDiceAxisId(),
			label: 'Кубы',
			kind: 'attackDice',
			values: this.attackDiceValues(),
			preferredColumn: false
		});

		if (this.attackSkill) {
			this.addAxis({
				id: skillParameterAxisId(this.attackSkill.parameter),
				label: this.attackSkill.name,
				kind: 'skillLevel',
				values: this.activeSkillLevelValues(),
				preferredColumn: true
			});
		}
	}

	private addDamageSourceAxes() {
		for (const damageParameter of this.damageParameters) {
			const value = damageParameter.value;

			if (isProgressionParameterValue(value)) {
				this.addProgressionAxes(damageParameter.block, value);
			} else if (isAutoParameterValue(value)) {
				this.addAutoAxes(damageParameter.block, value);
			} else if (isFormulaParameterValue(value)) {
				this.addFormulaAxes(damageParameter.block, value);
			}
		}
	}

	private addProgressionAxes(
		block: SpellMechanicBlockDraft,
		value: SpellProgressionParameterValue
	) {
		if (value.sourceKind === 'skillLevel') {
			this.addMechanicParameterAxis(block, value.sourceKey);
		}
	}

	private addAutoAxes(
		block: SpellMechanicBlockDraft,
		value: SpellAutoParameterValue
	) {
		for (const source of value.sources) {
			this.addSourceAxis(block, source.sourceKind, source.sourceKey);

			if (source.transformSourceKey.trim()) {
				const transformSource = value.sources.find(
					item =>
						item.id === source.transformSourceKey ||
						item.sourceKey === source.transformSourceKey
				);

				if (transformSource) {
					this.addSourceAxis(
						block,
						transformSource.sourceKind,
						transformSource.sourceKey
					);
				}
			}
		}
	}

	private addFormulaAxes(
		block: SpellMechanicBlockDraft,
		value: SpellFormulaParameterValue
	) {
		for (const sourceId of formulaSourceIds(value.graph)) {
			const source = parseFormulaSourceId(sourceId);

			if (!source) {
				continue;
			}

			if (source.kind === 'skillParameterLevel') {
				this.addMechanicParameterAxis(block, source.key);
			} else if (source.kind === 'parameter') {
				this.addMechanicParameterAxis(block, source.key);
			} else if (source.kind === 'systemValue') {
				this.addSystemValueAxis(source.key);
			}
		}
	}

	private addSourceAxis(
		block: SpellMechanicBlockDraft,
		sourceKind: string,
		sourceKey: string
	) {
		switch (sourceKind) {
			case 'systemValue':
				this.addSystemValueAxis(sourceKey);
				break;
			case 'mechanicParameter':
			case 'skillLevel':
				this.addMechanicParameterAxis(block, sourceKey);
				break;
		}
	}

	private addSystemValueAxis(sourceKey: string) {
		const systemValue = this.systemValue(sourceKey);

		if (!systemValue || !isCasterLevelSystemValue(systemValue)) {
			return;
		}

		this.addAxis({
			id: systemValueAxisId(systemValue),
			label: systemValue.name,
			kind: 'casterLevel',
			values: this.casterLevelValues(),
			preferredColumn: false
		});
	}

	private addMechanicParameterAxis(
		block: SpellMechanicBlockDraft,
		sourceKey: string
	) {
		const parameter = this.mechanicParameter(block, sourceKey);

		if (!parameter || parameter.scope !== 'caster') {
			return;
		}

		this.addAxis({
			id: skillParameterAxisId(parameter),
			label: parameter.name,
			kind: parameter.kind === 'skill' ? 'skillLevel' : 'numeric',
			values:
				parameter.kind === 'skill'
					? this.activeSkillLevelValues()
					: this.casterLevelValues(),
			preferredColumn:
				parameter.kind === 'skill' &&
				this.attackSkill?.parameter.id === parameter.id
		});
	}

	private addAxis(axis: BalanceCasterAxis) {
		if (!axis.values.length || this.axes.has(axis.id)) {
			return;
		}

		this.axes.set(axis.id, axis);
	}

	private collectDamageParameters(): BalanceDamageParameter[] {
		const parameters: BalanceDamageParameter[] = [];

		for (const block of this.input.draft.mechanicBlocks) {
			const mechanic = this.mechanicForBlock(block);
			const damageParameters =
				mechanic?.parameters.filter(
					parameter =>
						parameter.kind === 'number' && parameter.numericRole === 'damage'
				) ?? [];

			parameters.push(
				...damageParameters.map(parameter => ({
					block,
					parameter,
					value: this.parameterValue(block, parameter)
				}))
			);
		}

		return parameters;
	}

	private evaluateDamage(context: BalanceDamageEvaluationContext): number {
		const attackDice = context.axisValues.get(attackDiceAxisId()) ?? 0;
		const attackSkillLevel = this.attackSkill
			? (context.axisValues.get(skillParameterAxisId(this.attackSkill.parameter)) ??
				0)
			: 0;
		const attackDistribution = this.successDistribution(
			attackDice,
			attackSkillLevel
		);
		const defenseDistribution = this.successDistribution(
			context.defenseDice,
			context.defenseSkillLevel
		);
		const parameterDamage = this.damageParameters.reduce(
			(sum, parameter) =>
				sum + this.evaluateDamageParameter(parameter, context),
			0
		);

		let expectedDamage = 0;

		for (const [attackSuccesses, attackProbability] of attackDistribution) {
			for (const [defenseSuccesses, defenseProbability] of defenseDistribution) {
				if (attackSuccesses <= defenseSuccesses) {
					continue;
				}

				const outcomeDamage = Math.max(
					0,
					attackSuccesses -
						defenseSuccesses +
						parameterDamage -
						context.absorbed
				);
				expectedDamage +=
					attackProbability * defenseProbability * outcomeDamage;
			}
		}

		return expectedDamage;
	}

	private evaluateDamageParameter(
		damageParameter: BalanceDamageParameter,
		context: BalanceDamageEvaluationContext
	): number {
		const value = damageParameter.value;

		if (isStaticParameterValue(value) || typeof value === 'string') {
			return staticNumber(value) ?? 0;
		}

		if (isProgressionParameterValue(value)) {
			return this.evaluateProgressionDamage(
				damageParameter.block,
				value,
				context
			);
		}

		if (isAutoParameterValue(value)) {
			return this.evaluateAutoDamage(damageParameter.block, value, context);
		}

		if (isFormulaParameterValue(value)) {
			return this.evaluateFormulaDamage(damageParameter.block, value, context);
		}

		return 0;
	}

	private evaluateProgressionDamage(
		block: SpellMechanicBlockDraft,
		value: SpellProgressionParameterValue,
		context: BalanceDamageEvaluationContext
	): number {
		const preset = this.input.progressionPresets.find(
			item => item.id === value.presetId
		);

		if (!preset) {
			return 0;
		}

		return evaluateRoundedProgression(
			preset.kind,
			value.config,
			this.sourceValue(block, value.sourceKind, value.sourceKey, context)
		);
	}

	private evaluateAutoDamage(
		block: SpellMechanicBlockDraft,
		value: SpellAutoParameterValue,
		context: BalanceDamageEvaluationContext
	): number {
		const sourceValueOverrides = new Map(
			value.sources.map(
				source =>
					[
						source.id,
						this.sourceValue(
							block,
							source.sourceKind,
							source.sourceKey,
							context
						)
					] as const
			)
		);

		return evaluateAutoParameterValue(value, this.primaryCasterX(context), {
			sourceValueOverrides,
			scaleMaxX: this.maxActiveSkillLevel()
		});
	}

	private evaluateFormulaDamage(
		block: SpellMechanicBlockDraft,
		value: SpellFormulaParameterValue,
		context: BalanceDamageEvaluationContext
	): number {
		return evaluateFormulaGraph(value.graph, sourceId =>
			this.formulaSourceValue(block, sourceId, context)
		);
	}

	private sourceValue(
		block: SpellMechanicBlockDraft | null,
		sourceKind: string,
		sourceKey: string,
		context: BalanceDamageEvaluationContext
	): number {
		switch (sourceKind) {
			case 'systemValue': {
				const value = this.systemValue(sourceKey);
				return value
					? (context.axisValues.get(systemValueAxisId(value)) ?? 0)
					: 0;
			}
			case 'mechanicParameter':
			case 'skillLevel':
				return block
					? this.mechanicParameterSourceValue(block, sourceKey, context)
					: this.primaryCasterX(context);
			case 'manual':
				return this.primaryCasterX(context);
			case 'essenceProfile':
				return 0;
			default:
				return 0;
		}
	}

	private formulaSourceValue(
		block: SpellMechanicBlockDraft,
		sourceId: string | null | undefined,
		context: BalanceDamageEvaluationContext
	): number {
		const source = parseFormulaSourceId(sourceId ?? '');

		if (!source) {
			return 0;
		}

		switch (source.kind) {
			case 'skillParameterLevel':
			case 'parameter':
				return this.mechanicParameterSourceValue(block, source.key, context);
			case 'systemValue': {
				const value = this.systemValue(source.key);
				return value
					? (context.axisValues.get(systemValueAxisId(value)) ?? 0)
					: 0;
			}
			case 'manual':
				return this.primaryCasterX(context);
			default:
				return 0;
		}
	}

	private mechanicParameterSourceValue(
		block: SpellMechanicBlockDraft,
		sourceKey: string,
		context: BalanceDamageEvaluationContext
	): number {
		const parameter = this.mechanicParameter(block, sourceKey);

		if (!parameter) {
			return this.primaryCasterX(context);
		}

		if (parameter.scope === 'target') {
			return parameter.kind === 'skill' ? context.defenseSkillLevel : 0;
		}

		if (parameter.scope === 'caster') {
			return (
				context.axisValues.get(skillParameterAxisId(parameter)) ??
				this.primaryCasterX(context)
			);
		}

		return 0;
	}

	private primaryCasterX(context: BalanceDamageEvaluationContext): number {
		if (this.attackSkill) {
			return (
				context.axisValues.get(
					skillParameterAxisId(this.attackSkill.parameter)
				) ?? 0
			);
		}

		return this.activeSkillLevelValues()[0] ?? 0;
	}

	private skillFromParameter(
		predicate: (parameter: SpellMechanicParameter) => boolean
	): BalanceSkillSource | null {
		for (const block of this.input.draft.mechanicBlocks) {
			const mechanic = this.mechanicForBlock(block);
			const skillParameter = mechanic?.parameters.find(parameter =>
				predicate(parameter)
			);

			if (!skillParameter) {
				continue;
			}

			const value = this.parameterValue(block, skillParameter);
			const skillId = staticString(value);

			if (skillId) {
				const skill = this.input.skills.find(item => item.id === skillId);

				return {
					id: skillId,
					name: skill?.name ?? skillParameter.name,
					rollCharacteristicId: skill?.rollCharacteristicId ?? null,
					parameter: skillParameter
				};
			}
		}

		return null;
	}

	private parameterValue(
		block: SpellMechanicBlockDraft,
		parameter: SpellMechanicParameter
	): SpellParameterValue | null {
		return (
			block.parameterValues[parameter.id] ??
			block.parameterValues[parameter.slug] ??
			null
		);
	}

	private mechanicParameter(
		block: SpellMechanicBlockDraft,
		sourceKey: string
	): SpellMechanicParameter | null {
		return (
			this.mechanicForBlock(block)?.parameters.find(
				item => item.id === sourceKey || item.slug === sourceKey
			) ?? null
		);
	}

	private mechanicForBlock(block: SpellMechanicBlockDraft) {
		return this.input.mechanics.find(
			mechanic => mechanic.id === block.mechanicId
		);
	}

	private systemValue(sourceKey: string) {
		return (
			this.input.systemValues.find(
				value => value.id === sourceKey || value.slug === sourceKey
			) ?? null
		);
	}

	private activeSkillLevelValues(): number[] {
		return this.input.skillLevels
			.filter(level => level.isActive && level.level > 0)
			.sort((first, second) => first.level - second.level)
			.map(level => level.level);
	}

	private maxActiveSkillLevel(): number {
		return Math.max(0, ...this.activeSkillLevelValues());
	}

	private casterLevelValues(): number[] {
		const maxCasterLevel = this.maxPossibleCasterLevel();
		return range(1, maxCasterLevel);
	}

	private maxPossibleCasterLevel(): number {
		const maxSkillLevel = this.maxActiveSkillLevel();
		const understandingsCount = this.input.skills.filter(
			skill => skill.isActive && isUnderstandingSkill(skill)
		).length;

		return maxSkillLevel * understandingsCount;
	}

	private attackDiceValues(): number[] {
		const characteristic = this.characteristic(
			this.attackSkill?.rollCharacteristicId ?? null
		);

		return characteristic ? range(1, Math.max(1, characteristic.maxValue)) : [];
	}

	private characteristic(characteristicId: string | null) {
		return characteristicId
			? (this.input.characteristics.find(item => item.id === characteristicId) ??
					null)
			: null;
	}

	private successDistribution(
		diceCount: number,
		skillLevel: number
	): SuccessDistribution {
		const rule = this.input.skillLevels.find(level => level.level === skillLevel);

		if (diceCount <= 0 || !rule?.canRoll || rule.successMin === null) {
			return new Map([[0, 1]]);
		}

		const singleDieDistribution = singleDieSuccessDistribution(rule);
		let distribution: SuccessDistribution = new Map([[0, 1]]);

		for (let diceIndex = 0; diceIndex < diceCount; diceIndex += 1) {
			distribution = combineSuccessDistributions(
				distribution,
				singleDieDistribution
			);
		}

		return distribution;
	}
}

function attackDiceAxisId() {
	return 'caster:attackDice';
}

function skillParameterAxisId(parameter: SpellMechanicParameter) {
	return `caster:parameter:${parameter.slug || parameter.id}`;
}

function systemValueAxisId(value: SystemValue) {
	return `caster:systemValue:${value.slug || value.id}`;
}

function isCasterLevelSystemValue(value: SystemValue): boolean {
	return (
		value.name === 'Уровень Заклинателя' || value.slug === 'uroven-zaklinatelya'
	);
}

function isDefenseSkillParameter(parameter: SpellMechanicParameter): boolean {
	return parameter.kind === 'skill' && parameter.scope === 'target';
}

function isAttackSkillParameter(parameter: SpellMechanicParameter): boolean {
	return parameter.kind === 'skill' && parameter.scope === 'caster';
}

function formulaSourceIds(
	graph: MechanicCalculationGraphState | null
): string[] {
	return (
		graph?.nodes
			.filter(node => node.kind === 'source' && !!node.sourceId)
			.map(node => node.sourceId as string) ?? []
	);
}

function parseFormulaSourceId(sourceId: string): {
	kind: string;
	key: string;
} | null {
	const separatorIndex = sourceId.indexOf(':');

	if (separatorIndex < 1) {
		return null;
	}

	return {
		kind: sourceId.slice(0, separatorIndex),
		key: sourceId.slice(separatorIndex + 1)
	};
}

function evaluateFormulaGraph(
	graph: MechanicCalculationGraphState | null,
	sourceValue: (sourceId: string | null | undefined) => number
) {
	if (!graph) {
		return 0;
	}

	const resultNode = graph.nodes.find(node => node.kind === 'result');

	if (!resultNode) {
		return 0;
	}

	return evaluateIncomingFormulaValue(
		resultNode.id,
		'in',
		graph,
		sourceValue,
		new Set()
	);
}

function evaluateIncomingFormulaValue(
	nodeId: string,
	handleId: string,
	graph: MechanicCalculationGraphState,
	sourceValue: (sourceId: string | null | undefined) => number,
	visited: Set<string>
) {
	const edge = graph.edges.find(
		item => item.target === nodeId && (item.targetHandle ?? 'in') === handleId
	);

	return edge
		? evaluateFormulaNodeValue(edge.source, graph, sourceValue, visited)
		: 0;
}

function evaluateFormulaNodeValue(
	nodeId: string,
	graph: MechanicCalculationGraphState,
	sourceValue: (sourceId: string | null | undefined) => number,
	visited: Set<string>
): number {
	if (visited.has(nodeId)) {
		return 0;
	}

	const node = graph.nodes.find(item => item.id === nodeId);

	if (!node) {
		return 0;
	}

	visited.add(nodeId);

	const value = (() => {
		switch (node.kind) {
			case 'source':
				return sourceValue(node.sourceId);
			case 'constant':
				return node.constantValue ?? 0;
			case 'operation':
				return evaluateFormulaOperationValue(
					node.id,
					node.operation,
					graph,
					sourceValue,
					visited
				);
			case 'comparison':
				return evaluateFormulaComparisonValue(
					node.id,
					node.comparison,
					graph,
					sourceValue,
					visited
				);
			case 'condition':
				return evaluateIncomingFormulaValue(
					node.id,
					evaluateIncomingFormulaValue(
						node.id,
						'condition',
						graph,
						sourceValue,
						visited
					) !== 0
						? 'then'
						: 'else',
					graph,
					sourceValue,
					visited
				);
			case 'result':
				return evaluateIncomingFormulaValue(
					node.id,
					'in',
					graph,
					sourceValue,
					visited
				);
		}
	})();

	visited.delete(nodeId);
	return Number.isFinite(value) ? value : 0;
}

function evaluateFormulaOperationValue(
	nodeId: string,
	operation: MechanicCalculationGraphState['nodes'][number]['operation'],
	graph: MechanicCalculationGraphState,
	sourceValue: (sourceId: string | null | undefined) => number,
	visited: Set<string>
) {
	const actualOperation = operation ?? 'sum';

	if (
		actualOperation === 'subtract' ||
		actualOperation === 'divide' ||
		actualOperation === 'power'
	) {
		const left = evaluateIncomingFormulaValue(
			nodeId,
			'a',
			graph,
			sourceValue,
			visited
		);
		const right = evaluateIncomingFormulaValue(
			nodeId,
			'b',
			graph,
			sourceValue,
			visited
		);

		switch (actualOperation) {
			case 'subtract':
				return left - right;
			case 'divide':
				return right === 0 ? 0 : left / right;
			case 'power':
				return left ** right;
		}
	}

	if (isUnaryFormulaOperation(actualOperation)) {
		const value = evaluateIncomingFormulaValue(
			nodeId,
			'in',
			graph,
			sourceValue,
			visited
		);

		switch (actualOperation) {
			case 'sqrt':
				return Math.sqrt(Math.max(0, value));
			case 'log':
				return Math.log(Math.max(0, value));
			case 'exp':
				return Math.exp(value);
			case 'floor':
				return Math.floor(value);
			case 'round':
				return Math.round(value);
			case 'ceil':
				return Math.ceil(value);
		}
	}

	const values = graph.edges
		.filter(edge => edge.target === nodeId)
		.map(edge =>
			evaluateFormulaNodeValue(edge.source, graph, sourceValue, visited)
		);

	if (!values.length) {
		return 0;
	}

	switch (actualOperation) {
		case 'sum':
			return values.reduce((sum, value) => sum + value, 0);
		case 'multiply':
			return values.reduce((product, value) => product * value, 1);
		case 'average':
			return values.reduce((sum, value) => sum + value, 0) / values.length;
		case 'min':
			return Math.min(...values);
		case 'max':
			return Math.max(...values);
		default:
			return 0;
	}
}

function evaluateFormulaComparisonValue(
	nodeId: string,
	comparison: MechanicCalculationGraphState['nodes'][number]['comparison'],
	graph: MechanicCalculationGraphState,
	sourceValue: (sourceId: string | null | undefined) => number,
	visited: Set<string>
) {
	const left = evaluateIncomingFormulaValue(
		nodeId,
		'a',
		graph,
		sourceValue,
		visited
	);
	const right = evaluateIncomingFormulaValue(
		nodeId,
		'b',
		graph,
		sourceValue,
		visited
	);

	switch (comparison ?? 'gte') {
		case 'eq':
			return left === right ? 1 : 0;
		case 'ne':
			return left !== right ? 1 : 0;
		case 'gt':
			return left > right ? 1 : 0;
		case 'gte':
			return left >= right ? 1 : 0;
		case 'lt':
			return left < right ? 1 : 0;
		case 'lte':
			return left <= right ? 1 : 0;
	}
}

function isUnaryFormulaOperation(
	operation: MechanicCalculationGraphState['nodes'][number]['operation']
) {
	return (
		operation === 'sqrt' ||
		operation === 'log' ||
		operation === 'exp' ||
		operation === 'floor' ||
		operation === 'round' ||
		operation === 'ceil'
	);
}

function staticNumber(value: SpellParameterValue | null): number | null {
	if (typeof value === 'string') {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}

	if (!isStaticParameterValue(value)) {
		return null;
	}

	const parsed = Number(value.value);
	return Number.isFinite(parsed) ? parsed : null;
}

function staticString(value: SpellParameterValue | null): string | null {
	if (typeof value === 'string' && value) {
		return value;
	}

	if (!isStaticParameterValue(value)) {
		return null;
	}

	return typeof value.value === 'string' && value.value ? value.value : null;
}

function isUnderstandingSkill(skill: { name: string }) {
	return skill.name.toLocaleLowerCase('ru').includes('понимание');
}

function singleDieSuccessDistribution(rule: SkillLevel): SuccessDistribution {
	const distribution: SuccessDistribution = new Map();

	for (let face = 1; face <= 6; face += 1) {
		let successes = 0;

		if (rule.successMin !== null && face >= rule.successMin) {
			successes += 1;
		}

		if (rule.doubleSuccessMin !== null && face >= rule.doubleSuccessMin) {
			successes += 1;
		}

		distribution.set(successes, (distribution.get(successes) ?? 0) + 1 / 6);
	}

	return distribution;
}

function combineSuccessDistributions(
	first: SuccessDistribution,
	second: SuccessDistribution
): SuccessDistribution {
	const combined: SuccessDistribution = new Map();

	for (const [firstSuccesses, firstProbability] of first) {
		for (const [secondSuccesses, secondProbability] of second) {
			const successes = firstSuccesses + secondSuccesses;
			combined.set(
				successes,
				(combined.get(successes) ?? 0) +
					firstProbability * secondProbability
			);
		}
	}

	return combined;
}

function range(min: number, max: number): number[] {
	if (max < min) {
		return [];
	}

	return Array.from({ length: max - min + 1 }, (_, index) => min + index);
}
