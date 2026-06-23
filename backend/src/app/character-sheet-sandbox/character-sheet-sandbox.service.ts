import {
	BadRequestException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { randomInt } from 'crypto';
import {
	Prisma,
	SystemValueOwnerType
} from '@prisma/generated';
import { GameEventDispatcherService } from '../game-events/game-event-dispatcher.service';
import { GameEventHandlersService } from '../game-events/game-event-handlers.service';
import {
	RuntimeSystemValue,
	SystemValueRuntimeService
} from '../game-events/system-value-runtime.service';
import { PrismaService } from '../prisma/prisma.service';
import { RollCharacterSheetSandboxSkillDto } from './dto/roll-character-sheet-sandbox-skill.dto';
import { UpdateCharacterSheetSandboxDraftDto } from './dto/update-character-sheet-sandbox-draft.dto';

const ADMIN_DRAFT_KEY = 'admin';
const D6_SIDES_COUNT = 6;

@Injectable()
export class CharacterSheetSandboxService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly dispatcher: GameEventDispatcherService,
		private readonly eventHandlers: GameEventHandlersService,
		private readonly systemValueRuntime: SystemValueRuntimeService
	) {}

	async getDraft() {
		const draft = await this.prisma.characterSheetSandboxDraft.findUnique({
			where: { key: ADMIN_DRAFT_KEY }
		});

		return {
			inputValues: this.normalizeInputValues(draft?.inputValues ?? {})
		};
	}

	async updateDraft(dto: UpdateCharacterSheetSandboxDraftDto) {
		const inputValues = this.normalizeInputValues(dto.inputValues ?? {});
		const draft = await this.persistDraft(inputValues);

		return {
			inputValues: this.normalizeInputValues(draft.inputValues)
		};
	}

	async rollSkill(dto: RollCharacterSheetSandboxSkillDto) {
		const runtimeValues = await this.loadRuntimeValues();
		const initialInputValues = {
			...runtimeValues.defaultInputValues,
			...this.normalizeInputValues(dto.inputValues ?? {})
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
			where: { id: dto.skillId }
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
		const diceCount = Math.max(0, Math.floor(dicePoolValue));
		const dice = Array.from({ length: diceCount }, () =>
			randomInt(1, D6_SIDES_COUNT + 1)
		);
		const successes = this.countSuccesses(dice, levelRule);
		const sixes = dice.filter(value => value === 6).length;
		const ones = dice.filter(value => value === 1).length;
		const ignoredOnes = Math.min(ones, levelRule?.ignoreOnesCount ?? 0);
		const consequenceCount = Math.max(0, ones - ignoredOnes);
		const globalHandlers = await this.eventHandlers.getActiveRollPerformedHandlers();
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
				diceCount,
				successes,
				sixes,
				ones,
				ignoredOnes,
				consequenceCount,
				skillLevel
			},
			handlers,
			values: runtimeValues.values,
			inputValues: initialInputValues
		});
		const nextInputValues = this.applyValueChanges(
			initialInputValues,
			dispatchResult.valueChanges
		);
		const draft = await this.persistDraft(nextInputValues);

		return {
			inputValues: this.normalizeInputValues(draft.inputValues),
			roll: {
				skillId: skill.id,
				skillName: skill.name,
				diceCount,
				dice,
				successes,
				sixes,
				ones,
				ignoredOnes,
				consequenceCount,
				consequenceName: skill.rollConsequence?.name ?? 'Без последствий',
				eventLogs: dispatchResult.logs,
				valueChanges: dispatchResult.valueChanges
			}
		};
	}

	private normalizeInputValues(value: Prisma.JsonValue): Record<string, number> {
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

	private async persistDraft(inputValues: Record<string, number>) {
		return this.prisma.characterSheetSandboxDraft.upsert({
			where: { key: ADMIN_DRAFT_KEY },
			update: {
				inputValues
			},
			create: {
				key: ADMIN_DRAFT_KEY,
				inputValues
			}
		});
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
		const availableAttributePool =
			skill.rollCharacteristic.attribute.availablePoolValueId
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

	private countSuccesses(
		dice: number[],
		levelRule:
			| {
					canRoll: boolean;
					successMin: number | null;
					doubleSuccessMin: number | null;
			  }
			| null
	) {
		if (!levelRule?.canRoll || levelRule.successMin === null) {
			return 0;
		}

		return dice.reduce((total, die) => {
			const normalSuccess = die >= levelRule.successMin ? 1 : 0;
			const doubleSuccess =
				levelRule.doubleSuccessMin !== null && die >= levelRule.doubleSuccessMin
					? 1
					: 0;

			return total + normalSuccess + doubleSuccess;
		}, 0);
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
			defaultInputValues: values.reduce<Record<string, number>>((result, value) => {
				result[value.id] = this.resolveDefaultInputValue(value, {
					skillDefaults,
					characteristicDefaults,
					characteristicsByAttributeId
				});
				return result;
			}, {})
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
			characteristicsByAttributeId: Map<string, Array<{ defaultValue: number }>>;
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
					?.reduce((total, characteristic) => total + characteristic.defaultValue, 0) ??
				0
			);
		}

		return 0;
	}
}
