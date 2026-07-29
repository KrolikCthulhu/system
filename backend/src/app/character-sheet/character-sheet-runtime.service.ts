import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { Prisma, SystemValueOwnerType } from '@prisma/generated';
import { DiceCheckRuntimeService } from '../game-events/dice-check-runtime.service';
import { GameEventDispatcherService } from '../game-events/game-event-dispatcher.service';
import { GameEventHandlersService } from '../game-events/game-event-handlers.service';
import {
	RuntimeSystemValue,
	SystemValueRuntimeService
} from '../game-events/system-value-runtime.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CharacterSheetRuntimeService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly diceRuntime: DiceCheckRuntimeService,
		private readonly dispatcher: GameEventDispatcherService,
		private readonly eventHandlers: GameEventHandlersService,
		private readonly systemValueRuntime: SystemValueRuntimeService
	) {}

	normalizeInputValues(value: Prisma.JsonValue): Record<string, number> {
		if (!value || typeof value !== 'object' || Array.isArray(value)) {
			throw new BadRequestException('Некорректные значения листа персонажа.');
		}

		const normalized: Record<string, number> = {};

		for (const [key, rawValue] of Object.entries(value)) {
			if (typeof rawValue !== 'number' || !Number.isFinite(rawValue)) {
				throw new BadRequestException('Значения листа должны быть числами.');
			}

			normalized[key] = rawValue;
		}

		return normalized;
	}

	async createInitialInputValues(inputValues: Record<string, number>) {
		const runtimeValues = await this.loadRuntimeValues();

		return {
			...runtimeValues.defaultInputValues,
			...this.normalizeInputValues(inputValues)
		};
	}

	async rollSkill(skillId: string, inputValues: Record<string, number>) {
		const runtimeValues = await this.loadRuntimeValues();
		const initialInputValues = {
			...runtimeValues.defaultInputValues,
			...this.normalizeInputValues(inputValues)
		};
		const skill = await this.prisma.skill.findUnique({
			select: {
				id: true,
				name: true,
				systemValueId: true,
				rollCharacteristic: {
					select: {
						id: true,
						systemValueId: true,
						attribute: {
							select: {
								id: true,
								systemValueId: true,
								poolPenaltyValueId: true,
								availablePoolValueId: true
							}
						}
					}
				},
				rollConsequence: {
					select: {
						id: true,
						name: true,
						rollEventGraph: true,
						isActive: true,
						sortOrder: true
					}
				}
			},
			where: { id: skillId }
		});

		if (!skill) {
			throw new NotFoundException('Навык не найден.');
		}

		const dicePoolValue = this.resolveSkillDicePool(
			skill,
			runtimeValues.values,
			initialInputValues
		);
		const skillLevel = Math.max(
			0,
			Math.floor(
				this.systemValueRuntime.evaluateValue(
					skill.systemValueId,
					runtimeValues.values,
					initialInputValues
				)
			)
		);
		const levelRule = await this.prisma.skillLevel.findUnique({
			select: {
				canRoll: true,
				successMin: true,
				doubleSuccessMin: true,
				ignoreOnesCount: true
			},
			where: { level: skillLevel }
		});
		const roll = this.diceRuntime.roll({
			diceCount: dicePoolValue,
			skillLevel,
			levelRule
		});
		const globalHandlers =
			await this.eventHandlers.getActiveRollPerformedHandlers();
		const handlers = [
			...globalHandlers,
			...(skill.rollConsequence
				? [
						{
							ownerType: 'ROLL_CONSEQUENCE' as const,
							ownerId: skill.rollConsequence.id,
							name: skill.rollConsequence.name,
							graph: skill.rollConsequence.rollEventGraph,
							isActive: skill.rollConsequence.isActive,
							sortOrder: skill.rollConsequence.sortOrder
						}
					]
				: [])
		];
		const dispatchResult = this.dispatcher.dispatchRollPerformed({
			payload: {
				diceCount: roll.diceCount,
				successes: roll.successes,
				sixes: roll.sixes,
				ones: roll.ones,
				ignoredOnes: roll.ignoredOnes,
				consequenceCount: roll.consequenceCount,
				skillLevel: roll.skillLevel
			},
			handlers,
			values: runtimeValues.values,
			inputValues: initialInputValues
		});
		const nextInputValues = this.applyValueChanges(
			initialInputValues,
			dispatchResult.valueChanges
		);

		return {
			inputValues: nextInputValues,
			roll: {
				skillId: skill.id,
				skillName: skill.name,
				diceCount: roll.diceCount,
				dice: roll.dice,
				successes: roll.successes,
				sixes: roll.sixes,
				ones: roll.ones,
				ignoredOnes: roll.ignoredOnes,
				consequenceCount: roll.consequenceCount,
				skillLevel: roll.skillLevel,
				consequenceName: skill.rollConsequence?.name ?? 'Без последствий',
				eventLogs: dispatchResult.logs,
				valueChanges: dispatchResult.valueChanges
			}
		};
	}

	private applyValueChanges(
		inputValues: Record<string, number>,
		changes: Array<{ valueId: string; value: number }>
	) {
		return changes.reduce(
			(nextValues, change) => ({
				...nextValues,
				[change.valueId]: change.value
			}),
			{ ...inputValues }
		);
	}

	private resolveSkillDicePool(
		skill: {
			rollCharacteristic: {
				systemValueId: string;
				attribute: {
					systemValueId: string;
					poolPenaltyValueId: string | null;
					availablePoolValueId: string | null;
				};
			} | null;
		},
		values: RuntimeSystemValue[],
		inputValues: Record<string, number>
	) {
		if (!skill.rollCharacteristic) {
			return 0;
		}

		const characteristicValue = this.systemValueRuntime.evaluateValue(
			skill.rollCharacteristic.systemValueId,
			values,
			inputValues
		);
		const availableAttributePool = skill.rollCharacteristic.attribute
			.availablePoolValueId
			? this.systemValueRuntime.evaluateValue(
					skill.rollCharacteristic.attribute.availablePoolValueId,
					values,
					inputValues
				)
			: this.resolveInlineAvailableAttributePool(
					skill.rollCharacteristic.attribute,
					values,
					inputValues
				);

		return Math.min(characteristicValue, availableAttributePool);
	}

	private resolveInlineAvailableAttributePool(
		attribute: {
			systemValueId: string;
			poolPenaltyValueId: string | null;
		},
		values: RuntimeSystemValue[],
		inputValues: Record<string, number>
	) {
		const attributeValue = this.systemValueRuntime.evaluateValue(
			attribute.systemValueId,
			values,
			inputValues
		);
		const penaltyValue = attribute.poolPenaltyValueId
			? this.systemValueRuntime.evaluateValue(
					attribute.poolPenaltyValueId,
					values,
					inputValues
				)
			: 0;
		return Math.max(0, attributeValue - penaltyValue);
	}

	private async loadRuntimeValues(): Promise<{
		values: RuntimeSystemValue[];
		defaultInputValues: Record<string, number>;
	}> {
		const [values, skills, characteristics] = await Promise.all([
			this.prisma.systemValue.findMany({
				select: {
					id: true,
					name: true,
					primaryOwnerType: true,
					primaryOwnerId: true,
					calculationGraph: true
				}
			}),
			this.prisma.skill.findMany({
				select: {
					id: true,
					defaultLevel: true
				}
			}),
			this.prisma.characteristic.findMany({
				select: {
					id: true,
					attributeId: true,
					defaultValue: true
				}
			})
		]);
		const skillDefaults = new Map(
			skills.map(skill => [skill.id, skill.defaultLevel])
		);
		const characteristicDefaults = new Map(
			characteristics.map(characteristic => [
				characteristic.id,
				characteristic.defaultValue
			])
		);
		const characteristicsByAttributeId = new Map<
			string,
			Array<{ defaultValue: number }>
		>();

		for (const characteristic of characteristics) {
			const list =
				characteristicsByAttributeId.get(characteristic.attributeId) ?? [];
			list.push({ defaultValue: characteristic.defaultValue });
			characteristicsByAttributeId.set(characteristic.attributeId, list);
		}

		return {
			values: values.map(value => ({
				id: value.id,
				name: value.name,
				calculationGraph: value.calculationGraph
			})),
			defaultInputValues: values.reduce<Record<string, number>>(
				(result, value) => {
					result[value.id] = this.resolveDefaultInputValue(value, {
						skillDefaults,
						characteristicDefaults,
						characteristicsByAttributeId
					});
					return result;
				},
				{}
			)
		};
	}

	private resolveDefaultInputValue(
		value: {
			primaryOwnerType: SystemValueOwnerType;
			primaryOwnerId: string | null;
		},
		context: {
			skillDefaults: Map<string, number>;
			characteristicDefaults: Map<string, number>;
			characteristicsByAttributeId: Map<
				string,
				Array<{ defaultValue: number }>
			>;
		}
	) {
		if (
			value.primaryOwnerType === SystemValueOwnerType.SKILL &&
			value.primaryOwnerId
		) {
			return context.skillDefaults.get(value.primaryOwnerId) ?? 0;
		}

		if (
			value.primaryOwnerType === SystemValueOwnerType.CHARACTERISTIC &&
			value.primaryOwnerId
		) {
			return context.characteristicDefaults.get(value.primaryOwnerId) ?? 0;
		}

		if (
			value.primaryOwnerType === SystemValueOwnerType.ATTRIBUTE &&
			value.primaryOwnerId
		) {
			return (
				context.characteristicsByAttributeId
					.get(value.primaryOwnerId)
					?.reduce(
						(total, characteristic) => total + characteristic.defaultValue,
						0
					) ?? 0
			);
		}

		return 0;
	}
}
