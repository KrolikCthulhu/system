import { spellMechanicActionKinds } from './spell-runtime-preview.types';
import { ExecuteSpellRuntimePreviewInput } from './spell-runtime-preview.types';
import {
	RuntimeAction,
	RuntimeActionResultMap,
	RuntimeBlock,
	RuntimeContext,
	RuntimeEffect,
	RuntimeEffectScaleItem,
	RuntimeMechanic,
	RuntimeParameter,
	RuntimeSpell,
	SpellRuntimePreviewErrorCode,
	SpellRuntimePreviewIdGenerator,
	SpellRuntimePreviewResult,
	SpellRuntimePreviewSuccess,
	RuntimeTraceEntry,
	RuntimeValue
} from './spell-runtime-preview.types';

type JsonObject = Record<string, unknown>;

class SpellRuntimePreviewError extends Error {
	constructor(
		readonly code: SpellRuntimePreviewErrorCode,
		message: string
	) {
		super(message);
	}
}

interface RuntimeSource {
	kind: string;
	parameterId?: string;
	actionId?: string;
	resultName?: string;
	value?: number;
	skillId?: string;
}

export class SpellRuntimePreviewEngine {
	private readonly idGenerator: SpellRuntimePreviewIdGenerator;

	constructor(options: { idGenerator: SpellRuntimePreviewIdGenerator }) {
		this.idGenerator = options.idGenerator;
	}

	async execute(
		input: ExecuteSpellRuntimePreviewInput
	): Promise<SpellRuntimePreviewResult> {
		try {
			return {
				ok: true,
				value: await this.executeOrThrow(input)
			};
		} catch (error) {
			if (error instanceof SpellRuntimePreviewError) {
				return {
					ok: false,
					error: {
						code: error.code,
						message: error.message
					}
				};
			}

			throw error;
		}
	}

	private async executeOrThrow(
		input: ExecuteSpellRuntimePreviewInput
	): Promise<SpellRuntimePreviewSuccess['value']> {
		const { spell, mechanics } = input;
		const context: RuntimeContext = {
			inputValues: normalizeNumberRecord(
				input.inputValues ?? {},
				'inputValues'
			),
			rollResults: normalizeNumberRecord(
				input.rollResults ?? {},
				'rollResults'
			),
			choiceResults: normalizeStringRecord(
				input.choiceResults ?? {},
				'choiceResults'
			),
			mechanicsById: new Map(
				mechanics.map(mechanic => [mechanic.id, mechanic])
			),
			resultsByActionId: new Map(),
			trace: [],
			traceParentStack: [],
			pendingRolls: [],
			pendingChoices: [],
			effects: [],
			logs: [],
			halted: false,
			blocked: false
		};

		this.checkSpellCastingAvailability(spell, context);

		for (const block of spell.mechanicBlocks.filter(item => item.isActive)) {
			if (context.halted) {
				break;
			}

			await this.executeBlock(spell, block, context);
		}

		const status: SpellRuntimePreviewSuccess['value']['status'] = context.blocked
			? 'BLOCKED'
			: context.pendingRolls.length
				? 'WAITING_FOR_ROLLS'
				: context.pendingChoices.length
					? 'WAITING_FOR_CHOICE'
					: 'COMPLETED';

		return {
			spell: {
				id: spell.id,
				name: spell.name,
				formulaName: `${spell.action.name} + ${spell.essence.name} + ${spell.gesture.name}`
			},
			status,
			pendingRolls: context.pendingRolls,
			pendingChoices: context.pendingChoices,
			effects: context.effects,
			actionResults: Object.fromEntries(context.resultsByActionId),
			trace: context.trace,
			logs: context.logs
		};
	}

	private checkSpellCastingAvailability(
		spell: RuntimeSpell,
		context: RuntimeContext
	) {
		const linkedUnderstandingSkills = spell.essence.skillLinks
			.map(link => link.skill)
			.filter(skill =>
				skill.name.toLocaleLowerCase('ru').includes('понимание')
			);

		if (
			linkedUnderstandingSkills.length &&
			linkedUnderstandingSkills.some(
				skill => (context.inputValues[skill.systemValueId] ?? 0) > 0
			)
		) {
			return;
		}

		const message =
			'Нельзя кастовать: требуется хотя бы одно связанное Понимание выше 0.';

		context.blocked = true;
		context.halted = true;
		context.logs.push(message);
		context.trace.push({
			id: this.nextId(),
			blockId: spell.id,
			blockName: spell.name,
			actionId: 'spell-casting-availability',
			actionName: 'Проверка доступности',
			actionKind: 'guard',
			status: 'executed',
			message,
			results: {},
			children: []
		});
	}

	private async executeBlock(
		spell: RuntimeSpell,
		block: RuntimeBlock,
		context: RuntimeContext
	) {
		const actions = block.mechanic.actions.filter(action => action.isActive);

		for (const action of actions) {
			if (context.halted) {
				break;
			}

			this.executeAction(spell, block, action, context);
		}
	}

	private executeAction(
		spell: RuntimeSpell,
		block: RuntimeBlock,
		action: RuntimeAction,
		context: RuntimeContext
	) {
		switch (action.kind) {
			case spellMechanicActionKinds.roll:
				this.executeRollAction(spell, block, action, context);
				return;
			case spellMechanicActionKinds.comparison:
				this.executeComparisonAction(block, action, context);
				return;
			case spellMechanicActionKinds.calculation:
				this.executeCalculationAction(block, action, context);
				return;
			case spellMechanicActionKinds.branch:
				this.executeBranchAction(spell, block, action, context);
				return;
			case spellMechanicActionKinds.effectScale:
				this.executeEffectScaleAction(spell, block, action, context);
				return;
			case spellMechanicActionKinds.valueChange:
				this.executeValueChangeAction(block, action, context);
				return;
			case spellMechanicActionKinds.conditionAdd:
				this.executeConditionAction(block, action, context, 'conditionAdd');
				return;
			case spellMechanicActionKinds.conditionRemove:
				this.executeConditionAction(block, action, context, 'conditionRemove');
				return;
			case spellMechanicActionKinds.text:
				this.executeTextAction(block, action, context);
				return;
			case spellMechanicActionKinds.check:
			case spellMechanicActionKinds.custom:
				throw new SpellRuntimePreviewError(
					'unsupported_action',
					`Шаг "${action.name}" имеет тип, который пока не поддержан runtime.`
				);
		}
	}

	private executeRollAction(
		spell: RuntimeSpell,
		block: RuntimeBlock,
		action: RuntimeAction,
		context: RuntimeContext
	) {
		const config = toRecord(action.config);
		const resultName = requireString(config, 'resultName', action.name);
		const rollKey = `${block.id}:${action.id}:${resultName}`;
		const directRollResult =
			context.rollResults[rollKey] ?? context.rollResults[action.id];
		const actor = this.resolveSource(spell, block, config['actor'], context);
		const skill = this.resolveSource(spell, block, config['skill'], context);
		const optional = config['optional'] === true;

		if (directRollResult === undefined) {
			if (optional) {
				const results = { [resultName]: 0 };
				this.storeActionResults(action, results, context);
				this.pushTrace(block, action, context, {
					status: 'executed',
					message: 'Бросок пропущен.',
					results
				});
				return;
			}

			context.pendingRolls.push({
				blockId: block.id,
				blockName: block.mechanic.name,
				actionId: action.id,
				actionName: action.name,
				resultName,
				actor,
				skill,
				optional
			});
			context.halted = true;
			this.pushTrace(block, action, context, {
				status: 'pending',
				message: 'Ожидается результат броска.',
				results: {}
			});
			return;
		}

		const results = { [resultName]: directRollResult };
		this.storeActionResults(action, results, context);
		this.pushTrace(block, action, context, {
			status: 'executed',
			message: `Результат броска: ${directRollResult}.`,
			results
		});
	}

	private executeComparisonAction(
		block: RuntimeBlock,
		action: RuntimeAction,
		context: RuntimeContext
	) {
		const config = toRecord(action.config);
		const left = toNumber(
			this.resolveSource(null, block, config['left'], context)
		);
		const right = toNumber(
			this.resolveSource(null, block, config['right'], context)
		);
		const operator = requireString(config, 'operator', action.name);
		const resultName = requireString(config, 'resultName', action.name);
		const marginResultName = stringValue(config['marginResultName']);
		const result = compareNumbers(left, right, operator);
		const results: RuntimeActionResultMap = { [resultName]: result };

		if (marginResultName) {
			results[marginResultName] = Math.max(0, left - right);
		}

		this.storeActionResults(action, results, context);
		this.pushTrace(block, action, context, {
			status: 'executed',
			message: `${formatRuntimeValue(left)} ${operator} ${formatRuntimeValue(right)}: ${result ? 'да' : 'нет'}.`,
			results
		});
	}

	private executeCalculationAction(
		block: RuntimeBlock,
		action: RuntimeAction,
		context: RuntimeContext
	) {
		const config = toRecord(action.config);
		const resultName = requireString(config, 'resultName', action.name);
		const value = this.evaluateCalculationGraph(
			block,
			config['graph'],
			context
		);
		const results = { [resultName]: value };

		this.storeActionResults(action, results, context);
		this.pushTrace(block, action, context, {
			status: 'executed',
			message: `Вычислено значение ${formatRuntimeValue(value)}.`,
			results
		});
	}

	private executeBranchAction(
		spell: RuntimeSpell,
		block: RuntimeBlock,
		action: RuntimeAction,
		context: RuntimeContext
	) {
		const config = toRecord(action.config);
		const condition = toBoolean(
			this.resolveSource(spell, block, config['condition'], context)
		);
		const nestedActions = normalizeNestedActions(
			condition ? config['thenActions'] : config['elseActions']
		);

		this.storeActionResults(action, { result: condition }, context);
		this.pushTrace(block, action, context, {
			status: 'executed',
			message: condition
				? 'Выполняется ветка "если да".'
				: 'Выполняется ветка "если нет".',
			results: { result: condition }
		});

		for (const nestedAction of nestedActions) {
			if (context.halted) {
				break;
			}

			this.executeAction(spell, block, nestedAction, context);
		}
	}

	private executeEffectScaleAction(
		spell: RuntimeSpell,
		block: RuntimeBlock,
		action: RuntimeAction,
		context: RuntimeContext
	) {
		const blockConfig = toRecord(block.config);
		const effectiveConfig = toRecord(blockConfig['effectScale']);

		if (!Object.keys(effectiveConfig).length) {
			throw new SpellRuntimePreviewError(
				'invalid_effect_scale',
				`В блоке "${block.mechanic.name}" не настроена шкала эффекта.`
			);
		}
		const sourceValue = toNumber(
			this.resolveSource(spell, block, effectiveConfig['source'], context)
		);
		const mode = stringValue(effectiveConfig['mode']) ?? 'best';
		const resultName = stringValue(effectiveConfig['resultName']) ?? 'Эффект';
		const items = normalizeEffectScaleItems(
			effectiveConfig['items'],
			context.mechanicsById
		);
		const availableItems = items
			.filter(item => {
				if (item.requirement === 'automatic') {
					return true;
				}

				return mode === 'exact'
					? item.threshold === sourceValue
					: item.threshold <= sourceValue;
			})
			.sort(compareEffectScaleItems);

		if (!availableItems.length) {
			this.storeActionResults(action, { [resultName]: null }, context);
			this.pushTrace(block, action, context, {
				status: 'executed',
				message: `Нет доступных пунктов шкалы для результата ${sourceValue}.`,
				results: { [resultName]: null }
			});
			return;
		}

		const selectedItems =
			mode === 'all'
				? availableItems
				: mode === 'choice'
					? this.resolveEffectScaleChoice(
							block,
							action,
							resultName,
							sourceValue,
							availableItems,
							context
						)
					: [availableItems[availableItems.length - 1]];

		if (context.halted) {
			return;
		}

		const results = {
			[resultName]:
				selectedItems.length === 1
					? effectScaleItemResult(selectedItems[0])
					: { items: selectedItems.map(effectScaleItemResult) }
		};

		this.storeActionResults(action, results, context);
		const scaleTrace = this.pushTrace(block, action, context, {
			status: 'executed',
			message: `Выбрано пунктов шкалы: ${selectedItems.map(item => item.name).join(', ')}.`,
			results
		});

		for (const item of selectedItems) {
			this.withTraceParent(context, scaleTrace, () => {
				const itemTrace = this.pushTrace(block, action, context, {
					status: 'executed',
					message: `Выбран пункт: ${item.name}.`,
					results: { [resultName]: effectScaleItemResult(item) }
				});

				this.withTraceParent(context, itemTrace, () => {
					for (const nestedBlock of item.mechanicBlocks) {
						if (context.halted) {
							break;
						}

						this.executeBlock(spell, nestedBlock, context);
					}

					for (const nestedAction of item.actions) {
						if (context.halted) {
							break;
						}

						this.executeAction(spell, block, nestedAction, context);
					}
				});
			});

			if (context.halted) {
				break;
			}
		}
	}

	private withTraceParent(
		context: RuntimeContext,
		parent: RuntimeTraceEntry,
		callback: () => void
	) {
		context.traceParentStack.push(parent);

		try {
			callback();
		} finally {
			const removed = context.traceParentStack.pop();

			if (removed !== parent) {
				context.traceParentStack.length = Math.max(
					0,
					context.traceParentStack.indexOf(parent)
				);
			}
		}
	}

	private currentTraceParent(context: RuntimeContext) {
		return (
			context.traceParentStack[context.traceParentStack.length - 1] ?? null
		);
	}

	private resolveEffectScaleChoice(
		block: RuntimeBlock,
		action: RuntimeAction,
		resultName: string,
		sourceValue: number,
		availableItems: RuntimeEffectScaleItem[],
		context: RuntimeContext
	): RuntimeEffectScaleItem[] {
		const choiceKey = `${block.id}:${action.id}`;
		const selectedItemId =
			context.choiceResults[choiceKey] ?? context.choiceResults[action.id];

		if (!selectedItemId) {
			context.pendingChoices.push({
				blockId: block.id,
				blockName: block.mechanic.name,
				actionId: action.id,
				actionName: action.name,
				resultName,
				sourceValue,
				options: availableItems.map(item => ({
					id: item.id,
					requirement: item.requirement,
					threshold: item.threshold,
					name: item.name,
					description: item.description
				}))
			});
			context.halted = true;
			this.pushTrace(block, action, context, {
				status: 'pending',
				message: 'Ожидается выбор пункта шкалы эффекта.',
				results: {}
			});
			return [];
		}

		const selectedItem = availableItems.find(
			item => item.id === selectedItemId
		);

		if (!selectedItem) {
			throw new SpellRuntimePreviewError(
				'invalid_choice',
				'Выбранный пункт шкалы недоступен.'
			);
		}

		return [selectedItem];
	}

	private executeValueChangeAction(
		block: RuntimeBlock,
		action: RuntimeAction,
		context: RuntimeContext
	) {
		const config = toRecord(action.config);
		const amount = toNumber(
			this.resolveSource(null, block, config['amount'], context)
		);
		const operation = requireString(config, 'operation', action.name);
		const resolvedSystemValue = this.resolveSource(
			null,
			block,
			config['systemValue'],
			context
		);
		const effect: RuntimeEffect = {
			kind: 'valueChange',
			blockId: block.id,
			blockName: block.mechanic.name,
			actionId: action.id,
			actionName: action.name,
			target: this.resolveSource(null, block, config['target'], context),
			systemValueId:
				stringValue(resolvedSystemValue) ??
				stringValue(config['systemValueId']),
			systemValueName: stringValue(config['systemValueName']),
			operation,
			amount
		};

		context.effects.push(effect);
		this.storeActionResults(action, { amount }, context);
		this.pushTrace(block, action, context, {
			status: 'executed',
			message: `Подготовлено изменение значения: ${operation} ${formatRuntimeValue(amount)}.`,
			results: { amount }
		});
	}

	private executeConditionAction(
		block: RuntimeBlock,
		action: RuntimeAction,
		context: RuntimeContext,
		kind: 'conditionAdd' | 'conditionRemove'
	) {
		const config = toRecord(action.config);
		const resolvedCondition = this.resolveSource(
			null,
			block,
			config['condition'],
			context
		);
		const effect: RuntimeEffect = {
			kind,
			blockId: block.id,
			blockName: block.mechanic.name,
			actionId: action.id,
			actionName: action.name,
			target: this.resolveSource(null, block, config['target'], context),
			conditionId:
				stringValue(resolvedCondition) ?? stringValue(config['conditionId']),
			duration:
				kind === 'conditionAdd'
					? toNumber(
							this.resolveSource(null, block, config['duration'], context)
						)
					: null
		};

		context.effects.push(effect);
		this.storeActionResults(action, { result: true }, context);
		this.pushTrace(block, action, context, {
			status: 'executed',
			message:
				kind === 'conditionAdd'
					? 'Подготовлено наложение состояния.'
					: 'Подготовлено снятие состояния.',
			results: { result: true }
		});
	}

	private executeTextAction(
		block: RuntimeBlock,
		action: RuntimeAction,
		context: RuntimeContext
	) {
		const config = toRecord(action.config);
		const text = stringValue(config['text']) || action.name;

		context.effects.push({
			kind: 'text',
			blockId: block.id,
			blockName: block.mechanic.name,
			actionId: action.id,
			actionName: action.name,
			text
		});
		this.storeActionResults(action, { text }, context);
		this.pushTrace(block, action, context, {
			status: 'executed',
			message: text,
			results: { text }
		});
	}

	private resolveSource(
		spell: RuntimeSpell | null,
		block: RuntimeBlock,
		value: unknown,
		context: RuntimeContext
	): RuntimeValue {
		if (typeof value === 'string') {
			return this.resolveStringSource(spell, block, value, context);
		}

		if (!isRecord(value)) {
			return null;
		}

		const source: RuntimeSource = {
			kind: stringValue(value['kind']) ?? '',
			parameterId: stringValue(value['parameterId']) ?? undefined,
			actionId: stringValue(value['actionId']) ?? undefined,
			resultName: stringValue(value['resultName']) ?? undefined,
			value: typeof value['value'] === 'number' ? value['value'] : undefined,
			skillId: stringValue(value['skillId']) ?? undefined
		};

		switch (source.kind) {
			case 'constant':
				return typeof source.value === 'number' ? source.value : 0;
			case 'mechanicParameter':
				return source.parameterId
					? this.resolveMechanicParameterValue(
							block,
							source.parameterId,
							context
						)
					: null;
			case 'actionResult':
				return source.actionId
					? this.resolveActionResultById(
							source.actionId,
							source.resultName,
							context
						)
					: null;
			case 'linkedMagicWordSkill':
				return spell ? firstLinkedSkill(spell) : null;
			case 'staticSkill':
				return source.skillId ?? null;
			case 'caster':
				return 'caster';
			case 'spellTarget':
				return 'spellTarget';
			default:
				return null;
		}
	}

	private resolveStringSource(
		spell: RuntimeSpell | null,
		block: RuntimeBlock,
		sourceId: string,
		context: RuntimeContext
	): RuntimeValue {
		if (
			sourceId.startsWith('mechanicParameter:') ||
			sourceId.startsWith('parameter:') ||
			sourceId.startsWith('skillParameterLevel:')
		) {
			const parameterIdOrSlug = sourceId.slice(sourceId.indexOf(':') + 1);

			return this.resolveMechanicParameterValue(
				block,
				parameterIdOrSlug,
				context
			);
		}

		if (sourceId === 'manual:x') {
			return 0;
		}

		if (sourceId === 'linkedMagicWordSkill') {
			return spell ? firstLinkedSkill(spell) : null;
		}

		return null;
	}

	private resolveMechanicParameterValue(
		block: RuntimeBlock,
		parameterIdOrSlug: string,
		context: RuntimeContext
	): RuntimeValue {
		const values = toRecord(block.parameterValues);
		const parameter = block.mechanic.parameters.find(
			item => item.id === parameterIdOrSlug || item.slug === parameterIdOrSlug
		);
		const rawValue = parameter
			? values[parameter.slug]
			: values[parameterIdOrSlug];

		if (rawValue !== undefined) {
			return this.resolveParameterRuntimeValue(rawValue, context);
		}

		if (!parameter) {
			return null;
		}

		return this.resolveDefaultParameterValue(parameter);
	}

	private resolveParameterRuntimeValue(
		rawValue: unknown,
		context: RuntimeContext
	): RuntimeValue {
		if (
			typeof rawValue === 'string' ||
			typeof rawValue === 'number' ||
			typeof rawValue === 'boolean' ||
			rawValue === null
		) {
			return parseNumberLike(rawValue);
		}

		if (!isRecord(rawValue)) {
			return null;
		}

		const mode = stringValue(rawValue['mode']);

		if (mode === 'static') {
			return parseNumberLike(rawValue['value']);
		}

		if (mode === 'formula') {
			return this.evaluateCalculationGraphFromParameter(
				rawValue['graph'],
				context
			);
		}

		if (mode === 'progression' || mode === 'auto') {
			throw new SpellRuntimePreviewError(
				'unsupported_parameter_mode',
				`Параметр в режиме ${mode} пока не может быть выполнен runtime без выбранного источника x.`
			);
		}

		return rawValue;
	}

	private resolveDefaultParameterValue(
		parameter: RuntimeParameter
	): RuntimeValue {
		switch (parameter.defaultMode) {
			case 'STATIC':
				return (
					parameter.staticSkillId ??
					parameter.staticDamageTypeId ??
					parameter.staticConditionId ??
					parameter.staticSystemValueId ??
					parameter.staticTextValue ??
					null
				);
			case 'FROM_MAGIC_WORD':
			case 'EMPTY':
				return null;
		}
	}

	private resolveActionResultById(
		actionId: string,
		resultName: string | undefined,
		context: RuntimeContext
	): RuntimeValue {
		const results = context.resultsByActionId.get(actionId);

		return resultName ? (results?.[resultName] ?? null) : (results ?? null);
	}

	private evaluateCalculationGraph(
		block: RuntimeBlock,
		graphValue: unknown,
		context: RuntimeContext
	): number {
		const graph = parseCalculationGraph(graphValue);

		if (!graph) {
			throw new SpellRuntimePreviewError(
				'invalid_calculation_graph',
				'В шаге расчёта не настроен граф.'
			);
		}

		const resultNode = graph.nodes.find(node => node.kind === 'result');

		if (!resultNode) {
			throw new SpellRuntimePreviewError(
				'invalid_calculation_graph',
				'В шаге расчёта не выбран результат.'
			);
		}

		return this.evaluateCalculationNode(
			resultNode.id,
			block,
			graph,
			context,
			new Set()
		);
	}

	private evaluateCalculationGraphFromParameter(
		graphValue: unknown,
		context: RuntimeContext
	): number {
		const graph = parseCalculationGraph(graphValue);

		if (!graph) {
			throw new SpellRuntimePreviewError(
				'invalid_calculation_graph',
				'В формуле параметра не настроен граф.'
			);
		}

		const resultNode = graph.nodes.find(node => node.kind === 'result');
		const emptyBlock = {
			id: '',
			parameterValues: {},
			config: {},
			isActive: true,
			sortOrder: 0,
			mechanic: {
				id: '',
				name: '',
				parameters: [],
				actions: []
			}
		} satisfies RuntimeBlock;

		if (!resultNode) {
			throw new SpellRuntimePreviewError(
				'invalid_calculation_graph',
				'В формуле параметра не выбран результат.'
			);
		}

		return this.evaluateCalculationNode(
			resultNode.id,
			emptyBlock,
			graph,
			context,
			new Set()
		);
	}

	private evaluateCalculationNode(
		nodeId: string,
		block: RuntimeBlock,
		graph: CalculationGraph,
		context: RuntimeContext,
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
		const result = this.evaluateKnownCalculationNode(
			node,
			block,
			graph,
			context,
			visited
		);
		visited.delete(nodeId);

		return result;
	}

	private evaluateKnownCalculationNode(
		node: CalculationNode,
		block: RuntimeBlock,
		graph: CalculationGraph,
		context: RuntimeContext,
		visited: Set<string>
	): number {
		switch (node.kind) {
			case 'source':
				return toNumber(
					this.resolveSource(null, block, node.sourceId, context)
				);
			case 'constant':
				return node.constantValue ?? 0;
			case 'operation':
				return applyOperation(
					node.operation ?? 'sum',
					this.resolveCalculationInputs(node.id, block, graph, context, visited)
				);
			case 'comparison':
				return compareNumbers(
					this.evaluateHandleValue(
						node.id,
						'a',
						block,
						graph,
						context,
						visited
					),
					this.evaluateHandleValue(
						node.id,
						'b',
						block,
						graph,
						context,
						visited
					),
					node.comparison ?? 'gte'
				)
					? 1
					: 0;
			case 'condition':
				return this.evaluateHandleValue(
					node.id,
					this.evaluateHandleValue(
						node.id,
						'condition',
						block,
						graph,
						context,
						visited
					)
						? 'then'
						: 'else',
					block,
					graph,
					context,
					visited
				);
			case 'result':
				return this.evaluateHandleValue(
					node.id,
					'in',
					block,
					graph,
					context,
					visited
				);
			default:
				return 0;
		}
	}

	private resolveCalculationInputs(
		nodeId: string,
		block: RuntimeBlock,
		graph: CalculationGraph,
		context: RuntimeContext,
		visited: Set<string>
	) {
		return graph.edges
			.filter(edge => edge.target === nodeId)
			.map(edge =>
				this.evaluateCalculationNode(
					edge.source,
					block,
					graph,
					context,
					visited
				)
			);
	}

	private evaluateHandleValue(
		nodeId: string,
		handle: string,
		block: RuntimeBlock,
		graph: CalculationGraph,
		context: RuntimeContext,
		visited: Set<string>
	) {
		const edge = graph.edges.find(
			item => item.target === nodeId && item.targetHandle === handle
		);

		return edge
			? this.evaluateCalculationNode(
					edge.source,
					block,
					graph,
					context,
					visited
				)
			: 0;
	}

	private storeActionResults(
		action: Pick<RuntimeAction, 'id' | 'name'>,
		results: RuntimeActionResultMap,
		context: RuntimeContext
	) {
		context.resultsByActionId.set(action.id, results);
	}

	private pushTrace(
		block: RuntimeBlock,
		action: Pick<RuntimeAction, 'id' | 'name' | 'kind'>,
		context: RuntimeContext,
		entry: Pick<RuntimeTraceEntry, 'status' | 'message' | 'results'>
	) {
		const traceEntry: RuntimeTraceEntry = {
			id: this.nextId(),
			blockId: block.id,
			blockName: block.mechanic.name,
			actionId: action.id,
			actionName: action.name,
			actionKind: action.kind,
			status: entry.status,
			message: entry.message,
			results: entry.results,
			children: []
		};
		const parent = this.currentTraceParent(context);

		if (parent) {
			parent.children.push(traceEntry);
		} else {
			context.trace.push(traceEntry);
		}

		return traceEntry;
	}

	private nextId() {
		const id = this.idGenerator();
		return id || 'trace';
	}
}

interface CalculationNode {
	id: string;
	kind: string;
	sourceId?: unknown;
	constantValue?: number;
	operation?: string;
	comparison?: string;
}

interface CalculationEdge {
	source: string;
	target: string;
	targetHandle?: string;
}

interface CalculationGraph {
	nodes: CalculationNode[];
	edges: CalculationEdge[];
}

function normalizeNumberRecord(value: Record<string, unknown>, field: string) {
	const normalized: Record<string, number> = {};

	for (const [key, rawValue] of Object.entries(value)) {
		if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) {
			throw new SpellRuntimePreviewError(
				'invalid_input',
				`${field} должен содержать только числа.`
			);
		}

		normalized[key] = rawValue;
	}

	return normalized;
}

function normalizeStringRecord(value: Record<string, unknown>, field: string) {
	const normalized: Record<string, string> = {};

	for (const [key, rawValue] of Object.entries(value)) {
		if (typeof rawValue !== 'string') {
			throw new SpellRuntimePreviewError(
				'invalid_input',
				`${field} должен содержать только строки.`
			);
		}

		normalized[key] = rawValue;
	}

	return normalized;
}

function normalizeEffectScaleItems(
	value: unknown,
	mechanicsById: Map<string, RuntimeMechanic>
): RuntimeEffectScaleItem[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.filter(isRecord)
		.map((item, index) => ({
			id: stringValue(item['id']) || `item-${index}`,
			requirement: toEffectScaleRequirement(item['requirement']),
			threshold:
				typeof item['threshold'] === 'number' ? item['threshold'] : index,
			name: stringValue(item['name']) || `Пункт ${index + 1}`,
			description: stringValue(item['description']) ?? '',
			mechanicBlocks: normalizeNestedMechanicBlocks(
				item['mechanicBlocks'],
				mechanicsById
			),
			actions: normalizeNestedActions(item['actions'])
		}))
		.sort(compareEffectScaleItems);
}

function toEffectScaleRequirement(
	value: unknown
): RuntimeEffectScaleItem['requirement'] {
	return value === 'automatic' || value === 'successes' ? value : 'successes';
}

function compareEffectScaleItems(
	left: RuntimeEffectScaleItem,
	right: RuntimeEffectScaleItem
) {
	if (left.requirement !== right.requirement) {
		return left.requirement === 'automatic' ? -1 : 1;
	}

	return left.threshold - right.threshold;
}

function normalizeNestedMechanicBlocks(
	value: unknown,
	mechanicsById: Map<string, RuntimeMechanic>
): RuntimeBlock[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.filter(isRecord)
		.map((item, index) => {
			const mechanicId = stringValue(item['mechanicId']) ?? '';
			const mechanic = mechanicsById.get(mechanicId);

			if (!mechanic) {
				return null;
			}

			return {
				id: stringValue(item['id']) || `nested-mechanic-${index}`,
				parameterValues: isRecord(item['parameterValues'])
					? item['parameterValues']
					: {},
				config: isRecord(item['config']) ? item['config'] : {},
				isActive:
					typeof item['isActive'] === 'boolean' ? item['isActive'] : true,
				sortOrder:
					typeof item['sortOrder'] === 'number' ? item['sortOrder'] : index,
				mechanic
			} as unknown as RuntimeBlock;
		})
		.filter((item): item is RuntimeBlock => item !== null && item.isActive)
		.sort((left, right) => left.sortOrder - right.sortOrder);
}

function effectScaleItemResult(item: RuntimeEffectScaleItem): JsonObject {
	return {
		id: item.id,
		requirement: item.requirement,
		threshold: item.threshold,
		name: item.name,
		description: item.description
	};
}

function normalizeNestedActions(value: unknown): RuntimeAction[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.filter(isRecord)
		.map((item, index) => ({
			id: stringValue(item['id']) || `nested-${index}`,
			name: stringValue(item['name']) || `Шаг ${index + 1}`,
			kind: toActionKind(item['kind']),
			config: isRecord(item['config']) ? item['config'] : {},
			isActive: typeof item['isActive'] === 'boolean' ? item['isActive'] : true,
			sortOrder:
				typeof item['sortOrder'] === 'number' ? item['sortOrder'] : index
		}))
		.filter(action => action.isActive)
		.sort((left, right) => left.sortOrder - right.sortOrder);
}

function toActionKind(value: unknown) {
	switch (value) {
		case 'roll':
		case spellMechanicActionKinds.roll:
			return spellMechanicActionKinds.roll;
		case 'check':
		case spellMechanicActionKinds.check:
			return spellMechanicActionKinds.check;
		case 'comparison':
		case spellMechanicActionKinds.comparison:
			return spellMechanicActionKinds.comparison;
		case 'calculation':
		case spellMechanicActionKinds.calculation:
			return spellMechanicActionKinds.calculation;
		case 'branch':
		case spellMechanicActionKinds.branch:
			return spellMechanicActionKinds.branch;
		case 'effectScale':
		case spellMechanicActionKinds.effectScale:
			return spellMechanicActionKinds.effectScale;
		case 'valueChange':
		case spellMechanicActionKinds.valueChange:
			return spellMechanicActionKinds.valueChange;
		case 'conditionAdd':
		case spellMechanicActionKinds.conditionAdd:
			return spellMechanicActionKinds.conditionAdd;
		case 'conditionRemove':
		case spellMechanicActionKinds.conditionRemove:
			return spellMechanicActionKinds.conditionRemove;
		case 'text':
		case spellMechanicActionKinds.text:
			return spellMechanicActionKinds.text;
		default:
			return spellMechanicActionKinds.custom;
	}
}

function parseCalculationGraph(value: unknown): CalculationGraph | null {
	if (
		!isRecord(value) ||
		!Array.isArray(value['nodes']) ||
		!Array.isArray(value['edges'])
	) {
		return null;
	}

	return {
		nodes: value['nodes'].filter(isRecord).map(item => ({
			id: stringValue(item['id']) || '',
			kind: stringValue(item['kind']) || 'constant',
			sourceId: item['sourceId'],
			constantValue:
				typeof item['constantValue'] === 'number'
					? item['constantValue']
					: undefined,
			operation: stringValue(item['operation']) ?? undefined,
			comparison: stringValue(item['comparison']) ?? undefined
		})),
		edges: value['edges'].filter(isRecord).map(item => ({
			source: stringValue(item['source']) || '',
			target: stringValue(item['target']) || '',
			targetHandle: stringValue(item['targetHandle']) ?? undefined
		}))
	};
}

function firstLinkedSkill(spell: RuntimeSpell) {
	const link = [...spell.essence.skillLinks].sort(
		(left, right) => left.skill.sortOrder - right.skill.sortOrder
	)[0];

	return link?.skillId ?? null;
}

function toRecord(value: unknown): JsonObject {
	return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
	return typeof value === 'string' ? value : null;
}

function requireString(config: JsonObject, field: string, actionName: string) {
	const value = stringValue(config[field])?.trim();

	if (!value) {
		throw new SpellRuntimePreviewError(
			'invalid_input',
			`В шаге "${actionName}" не заполнено обязательное поле ${field}.`
		);
	}

	return value;
}

function parseNumberLike(value: unknown): RuntimeValue {
	if (typeof value === 'string' && value.trim() !== '') {
		const numericValue = Number(value.replace(',', '.'));

		return Number.isFinite(numericValue) ? numericValue : value;
	}

	return typeof value === 'number' && Number.isFinite(value)
		? value
		: (value as RuntimeValue);
}

function toNumber(value: RuntimeValue): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toBoolean(value: RuntimeValue) {
	if (typeof value === 'boolean') {
		return value;
	}

	if (typeof value === 'number') {
		return value !== 0;
	}

	return Boolean(value);
}

function compareNumbers(left: number, right: number, operator: string) {
	switch (operator) {
		case 'gt':
			return left > right;
		case 'gte':
			return left >= right;
		case 'eq':
			return left === right;
		case 'lte':
			return left <= right;
		case 'lt':
			return left < right;
		case 'ne':
			return left !== right;
		default:
			return left >= right;
	}
}

function applyOperation(operation: string, values: number[]) {
	switch (operation) {
		case 'average':
			return values.length
				? values.reduce((sum, value) => sum + value, 0) / values.length
				: 0;
		case 'min':
			return values.length ? Math.min(...values) : 0;
		case 'max':
			return values.length ? Math.max(...values) : 0;
		case 'multiply':
			return values.reduce(
				(result, value) => result * value,
				values.length ? 1 : 0
			);
		case 'subtract':
			return values.length
				? values.slice(1).reduce((result, value) => result - value, values[0])
				: 0;
		case 'divide':
			return values.length
				? values
						.slice(1)
						.reduce(
							(result, value) => (value === 0 ? result : result / value),
							values[0]
						)
				: 0;
		case 'power':
			return values.length >= 2
				? Math.pow(values[0], values[1])
				: (values[0] ?? 0);
		case 'sqrt':
			return Math.sqrt(Math.max(0, values[0] ?? 0));
		case 'log':
			return Math.log(Math.max(1, values[0] ?? 1));
		case 'exp':
			return Math.exp(values[0] ?? 0);
		case 'floor':
			return Math.floor(values[0] ?? 0);
		case 'round':
			return Math.round(values[0] ?? 0);
		case 'ceil':
			return Math.ceil(values[0] ?? 0);
		case 'sum':
		default:
			return values.reduce((sum, value) => sum + value, 0);
	}
}

function formatRuntimeValue(value: RuntimeValue) {
	if (typeof value === 'number') {
		return Number.isInteger(value) ? `${value}` : value.toFixed(2);
	}

	if (typeof value === 'boolean') {
		return value ? 'да' : 'нет';
	}

	if (typeof value === 'string') {
		return value;
	}

	return 'не выбрано';
}
