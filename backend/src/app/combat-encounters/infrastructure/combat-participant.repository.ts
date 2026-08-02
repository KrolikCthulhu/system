import {
	Injectable,
	NotFoundException
} from '@nestjs/common';
import { CombatEncounterParticipantKind } from '@prisma/generated';
import { PrismaService } from '../../prisma/prisma.service';
import { ExecuteCombatActionActor } from '../application/execute-combat-action.port';
import { CombatParticipantRepositoryPort } from '../application/combat-participant-repository.port';
import { CombatParticipantInitialValuesService } from '../combat-participant-initial-values.service';
import { combatEncounterStatuses } from '../domain/combat-encounter.types';
import { UpdateCombatParticipantDto } from '../dto/update-combat-participant.dto';

@Injectable()
export class CombatParticipantRepository
	implements CombatParticipantRepositoryPort
{
	constructor(
		private readonly prisma: PrismaService,
		private readonly initialValues: CombatParticipantInitialValuesService
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

		const initialValues = await this.initialValues.resolvePlayerCharacterValues(
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
				maximumPotential: initialValues.potential,
				currentSpeed: initialValues.speed,
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
		const initialValues = await this.initialValues.resolveCreatureValues(tier);

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
						currentPotential: initialValues.potential,
						maximumPotential: initialValues.potential,
						currentSpeed: initialValues.speed,
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
			select: {
				id: true,
				encounter: {
					select: {
						status: true
					}
				}
			},
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
				maximumPotential:
					input.dto.currentPotential !== undefined &&
					participant.encounter.status !== combatEncounterStatuses.active
						? input.dto.currentPotential
						: undefined,
				currentSpeed: input.dto.currentSpeed,
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
				roundParticipationEndedRound: true,
				encounter: {
					select: {
						currentRound: true
					}
				},
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

	private createCreatureSceneName(
		baseName: string,
		count: number,
		index: number
	) {
		return count > 1 ? `${baseName} ${index + 1}` : baseName;
	}
}
