import { Injectable, NotFoundException } from '@nestjs/common';
import { CombatEncounterParticipantKind, Prisma } from '@prisma/generated';
import { SystemValueRuntimeService } from '../../game-events/system-value-runtime.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ExecuteCombatActionActor } from '../application/execute-combat-action.port';
import { CombatParticipantRepositoryPort } from '../application/combat-participant-repository.port';
import { UpdateCombatParticipantDto } from '../dto/update-combat-participant.dto';

const HEALTH_VALUE_NAME = 'Здоровье';
const POTENTIAL_VALUE_NAME = 'Потенциал';

@Injectable()
export class CombatParticipantRepository
	implements CombatParticipantRepositoryPort
{
	constructor(
		private readonly prisma: PrismaService,
		private readonly systemValueRuntime: SystemValueRuntimeService
	) {}

	async addPlayerCharacter(input: {
		encounterId: string;
		campaignId: string;
		playerCharacterId: string;
	}) {
		const character = await this.prisma.playerCharacter.findFirst({
			select: {
				id: true,
				name: true,
				campaignId: true,
				sheetInputValues: true
			},
			where: {
				id: input.playerCharacterId,
				campaignId: input.campaignId,
				isActive: true
			}
		});

		if (!character) {
			throw new NotFoundException('Персонаж кампании не найден.');
		}

		const initialValues = await this.resolvePlayerCharacterCombatValues(
			character.sheetInputValues
		);

		await this.prisma.combatEncounterParticipant.create({
			data: {
				encounterId: input.encounterId,
				kind: CombatEncounterParticipantKind.PLAYER_CHARACTER,
				playerCharacterId: character.id,
				sceneName: character.name,
				currentHealth: initialValues.health,
				currentPotential: initialValues.potential,
				sortOrder: await this.getNextSortOrder(input.encounterId)
			}
		});
	}

	async addCreatures(input: {
		encounterId: string;
		creatureId: string;
		creatureTierId?: string | null;
		count: number;
		sceneName?: string;
	}) {
		const creature = await this.prisma.creature.findUnique({
			select: {
				id: true,
				name: true,
				tiers: {
					select: {
						id: true,
						tier: true,
						name: true,
						hp: true,
						sizeId: true,
						size: {
							select: {
								id: true,
								slug: true,
								name: true,
								rank: true
							}
						},
						characteristics: {
							select: {
								value: true,
								characteristic: {
									select: {
										systemValueId: true
									}
								}
							}
						},
						isActive: true
					},
					orderBy: [{ tier: 'asc' }]
				}
			},
			where: { id: input.creatureId }
		});

		if (!creature) {
			throw new NotFoundException('Существо не найдено.');
		}

		const tier = input.creatureTierId
			? creature.tiers.find(item => item.id === input.creatureTierId)
			: (creature.tiers.find(item => item.isActive) ?? creature.tiers[0]);

		if (!tier) {
			throw new NotFoundException('Ранг существа не найден.');
		}

		const count = input.count;
		const startSortOrder = await this.getNextSortOrder(input.encounterId);
		const initialPotential = await this.resolveCreatureInitialPotential(tier);

		await this.prisma.$transaction(
			Array.from({ length: count }, (_, index) =>
				this.prisma.combatEncounterParticipant.create({
					data: {
						encounterId: input.encounterId,
						kind: CombatEncounterParticipantKind.CREATURE,
						creatureId: creature.id,
						creatureTierId: tier.id,
						sceneName: this.createCreatureSceneName(
							input.sceneName || creature.name,
							count,
							index
						),
						currentHealth: tier.hp,
						currentPotential: initialPotential,
						sortOrder: startSortOrder + index
					}
				})
			)
		);
	}

	async update(input: {
		encounterId: string;
		participantId: string;
		dto: UpdateCombatParticipantDto;
	}) {
		const participant = await this.prisma.combatEncounterParticipant.findFirst({
			select: { id: true },
			where: {
				id: input.participantId,
				encounterId: input.encounterId
			}
		});

		if (!participant) {
			throw new NotFoundException('Участник столкновения не найден.');
		}

		await this.prisma.combatEncounterParticipant.update({
			where: { id: input.participantId },
			data: {
				sceneName: input.dto.sceneName?.trim(),
				currentHealth: input.dto.currentHealth,
				currentPotential: input.dto.currentPotential,
				initiative: input.dto.initiative,
				isActive: input.dto.isActive
			}
		});
	}

	findActiveActor(input: {
		encounterId: string;
		actorParticipantId: string;
	}): Promise<ExecuteCombatActionActor | null> {
		return this.prisma.combatEncounterParticipant.findFirst({
			select: {
				id: true,
				encounterId: true,
				currentPotential: true,
				creature: {
					select: {
						actions: true,
						naturalAttackLinks: {
							select: {
								naturalAttackId: true,
								naturalAttack: {
									select: {
										id: true,
										slug: true,
										name: true
									}
								},
								attackProfiles: true,
								isActive: true,
								sortOrder: true
							}
						}
					}
				},
				creatureTier: {
					select: {
						actions: true,
						actionOverrides: true
					}
				}
			},
			where: {
				id: input.actorParticipantId,
				encounterId: input.encounterId,
				isActive: true
			}
		});
	}

	async assertActiveParticipant(encounterId: string, participantId: string) {
		const participant = await this.prisma.combatEncounterParticipant.findFirst({
			select: { id: true },
			where: {
				id: participantId,
				encounterId,
				isActive: true
			}
		});

		if (!participant) {
			throw new NotFoundException('Цель действия не найдена.');
		}
	}

	findForSizeRule(encounterId: string, participantId: string) {
		return this.prisma.combatEncounterParticipant.findFirst({
			select: {
				id: true,
				kind: true,
				creatureTier: {
					select: {
						size: {
							select: {
								id: true,
								name: true,
								rank: true
							}
						}
					}
				}
			},
			where: {
				id: participantId,
				encounterId,
				isActive: true
			}
		});
	}

	findDefaultSizeForSizeRule() {
		return this.prisma.creatureSize.findFirst({
			select: {
				id: true,
				name: true,
				rank: true
			},
			where: { slug: 'sredniy' }
		});
	}

	findDefenseTarget(participantId: string) {
		return this.prisma.combatEncounterParticipant.findUnique({
			select: {
				id: true,
				kind: true,
				playerCharacter: {
					select: {
						ownerUserId: true
					}
				}
			},
			where: { id: participantId }
		});
	}

	private async getNextSortOrder(encounterId: string) {
		const lastParticipant =
			await this.prisma.combatEncounterParticipant.findFirst({
				select: { sortOrder: true },
				where: { encounterId },
				orderBy: { sortOrder: 'desc' }
			});

		return (lastParticipant?.sortOrder ?? -1) + 1;
	}

	private async resolvePlayerCharacterCombatValues(
		inputValues: Prisma.JsonValue
	) {
		const normalizedInputValues = normalizeInputValues(inputValues);
		const values = await this.prisma.systemValue.findMany({
			select: {
				id: true,
				name: true,
				calculationGraph: true
			}
		});
		const runtimeValues = values.map(value => ({
			id: value.id,
			name: value.name,
			calculationGraph: value.calculationGraph
		}));

		return {
			health: this.resolveNamedValue(
				HEALTH_VALUE_NAME,
				runtimeValues,
				normalizedInputValues
			),
			potential: this.resolveNamedValue(
				POTENTIAL_VALUE_NAME,
				runtimeValues,
				normalizedInputValues
			)
		};
	}

	private resolveNamedValue(
		name: string,
		values: Array<{
			id: string;
			name: string;
			calculationGraph: Prisma.JsonValue | null;
		}>,
		inputValues: Record<string, number>
	) {
		const value = values.find(item => item.name === name);

		return value
			? Math.max(
					0,
					Math.floor(
						this.systemValueRuntime.evaluateValue(value.id, values, inputValues)
					)
				)
			: 0;
	}

	private async resolveCreatureInitialPotential(tier: {
		characteristics: Array<{
			value: number;
			characteristic: { systemValueId: string };
		}>;
	}) {
		const inputValues = tier.characteristics.reduce<Record<string, number>>(
			(result, item) => ({
				...result,
				[item.characteristic.systemValueId]: item.value
			}),
			{}
		);
		const values = await this.prisma.systemValue.findMany({
			select: {
				id: true,
				name: true,
				calculationGraph: true
			}
		});

		return this.resolveNamedValue(POTENTIAL_VALUE_NAME, values, inputValues);
	}

	private createCreatureSceneName(
		baseName: string,
		count: number,
		index: number
	) {
		return count > 1 ? `${baseName} ${index + 1}` : baseName;
	}
}

function normalizeInputValues(value: Prisma.JsonValue): Record<string, number> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return {};
	}

	return Object.entries(value).reduce<Record<string, number>>(
		(result, [key, rawValue]) => {
			if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
				result[key] = rawValue;
			}

			return result;
		},
		{}
	);
}
