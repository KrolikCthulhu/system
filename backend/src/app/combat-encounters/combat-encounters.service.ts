import {
	ForbiddenException,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import {
	CampaignMemberRole,
	CampaignMemberStatus,
	CombatEncounterParticipantKind,
	CombatEncounterStatus,
	Prisma
} from '@prisma/generated';
import { SystemValueRuntimeService } from '../game-events/system-value-runtime.service';
import { PrismaService } from '../prisma/prisma.service';
import {
	CombatSizeRuleSize,
	resolveKnockdownSizeRule
} from './combat-size-rules';
import { AddCreatureParticipantDto } from './dto/add-creature-participant.dto';
import { AddPlayerCharacterParticipantDto } from './dto/add-player-character-participant.dto';
import { CreateCombatEncounterDto } from './dto/create-combat-encounter.dto';
import { KnockdownSizeRuleQueryDto } from './dto/knockdown-size-rule-query.dto';
import { UpdateCombatParticipantDto } from './dto/update-combat-participant.dto';

const HEALTH_VALUE_NAME = 'Здоровье';
const POTENTIAL_VALUE_NAME = 'Потенциал';

const combatEncounterSelect = {
	id: true,
	campaignId: true,
	name: true,
	status: true,
	isActive: true,
	createdAt: true,
	updatedAt: true,
	participants: {
		select: {
			id: true,
			kind: true,
			playerCharacterId: true,
			playerCharacter: {
				select: {
					id: true,
					name: true,
					ownerUser: {
						select: {
							id: true,
							displayUsername: true,
							username: true
						}
					}
				}
			},
			creatureId: true,
			creature: {
				select: {
					id: true,
					name: true
				}
			},
			creatureTierId: true,
			creatureTier: {
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
					}
				}
			},
			sceneName: true,
			currentHealth: true,
			currentPotential: true,
			initiative: true,
			isActive: true,
			sortOrder: true,
			createdAt: true,
			updatedAt: true
		},
		orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
	}
} satisfies Prisma.CombatEncounterSelect;

type CombatEncounterRecord = Prisma.CombatEncounterGetPayload<{
	select: typeof combatEncounterSelect;
}>;

@Injectable()
export class CombatEncountersService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly systemValueRuntime: SystemValueRuntimeService
	) {}

	async getCampaignEncounters(campaignId: string, userId: string) {
		await this.getActiveCampaignMember(campaignId, userId);

		const encounters = await this.prisma.combatEncounter.findMany({
			select: combatEncounterSelect,
			where: {
				campaignId,
				isActive: true
			},
			orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }]
		});

		return {
			encounters: encounters.map(encounter => this.mapEncounter(encounter))
		};
	}

	async createEncounter(
		campaignId: string,
		userId: string,
		dto: CreateCombatEncounterDto
	) {
		await this.assertCampaignGm(campaignId, userId);

		const encounter = await this.prisma.combatEncounter.create({
			select: combatEncounterSelect,
			data: {
				campaignId,
				name: dto.name?.trim() || 'Новое столкновение',
				status: CombatEncounterStatus.DRAFT
			}
		});

		return this.mapEncounter(encounter);
	}

	async getEncounter(id: string, userId: string) {
		const encounter = await this.findEncounter(id);
		await this.getActiveCampaignMember(encounter.campaignId, userId);
		return this.mapEncounter(encounter);
	}

	async addPlayerCharacter(
		id: string,
		userId: string,
		dto: AddPlayerCharacterParticipantDto
	) {
		const encounter = await this.findEncounter(id);
		await this.assertCampaignGm(encounter.campaignId, userId);

		const character = await this.prisma.playerCharacter.findFirst({
			select: {
				id: true,
				name: true,
				campaignId: true,
				sheetInputValues: true
			},
			where: {
				id: dto.playerCharacterId,
				campaignId: encounter.campaignId,
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
				encounterId: id,
				kind: CombatEncounterParticipantKind.PLAYER_CHARACTER,
				playerCharacterId: character.id,
				sceneName: character.name,
				currentHealth: initialValues.health,
				currentPotential: initialValues.potential,
				sortOrder: await this.getNextParticipantSortOrder(id)
			}
		});

		return this.getEncounter(id, userId);
	}

	async addCreature(
		id: string,
		userId: string,
		dto: AddCreatureParticipantDto
	) {
		const encounter = await this.findEncounter(id);
		await this.assertCampaignGm(encounter.campaignId, userId);

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
						isActive: true
					},
					orderBy: [{ tier: 'asc' }]
				}
			},
			where: { id: dto.creatureId }
		});

		if (!creature) {
			throw new NotFoundException('Существо не найдено.');
		}

		const tier = dto.creatureTierId
			? creature.tiers.find(item => item.id === dto.creatureTierId)
			: (creature.tiers.find(item => item.isActive) ?? creature.tiers[0]);

		if (!tier) {
			throw new NotFoundException('Ранг существа не найден.');
		}

		const count = dto.count ?? 1;
		const startSortOrder = await this.getNextParticipantSortOrder(id);

		await this.prisma.$transaction(
			Array.from({ length: count }, (_, index) =>
				this.prisma.combatEncounterParticipant.create({
					data: {
						encounterId: id,
						kind: CombatEncounterParticipantKind.CREATURE,
						creatureId: creature.id,
						creatureTierId: tier.id,
						sceneName: this.createCreatureSceneName(
							dto.sceneName?.trim() || creature.name,
							count,
							index
						),
						currentHealth: tier.hp,
						currentPotential: 0,
						sortOrder: startSortOrder + index
					}
				})
			)
		);

		return this.getEncounter(id, userId);
	}

	async getKnockdownSizeRule(
		id: string,
		userId: string,
		query: KnockdownSizeRuleQueryDto
	) {
		const encounter = await this.findEncounter(id);
		await this.getActiveCampaignMember(encounter.campaignId, userId);

		const [attacker, target, defaultSize] = await this.prisma.$transaction([
			this.findParticipantForSizeRule(id, query.attackerParticipantId),
			this.findParticipantForSizeRule(id, query.targetParticipantId),
			this.prisma.creatureSize.findFirst({
				select: {
					id: true,
					name: true,
					rank: true
				},
				where: { slug: 'sredniy' }
			})
		]);

		if (!attacker || !target) {
			throw new NotFoundException('Участник столкновения не найден.');
		}

		return resolveKnockdownSizeRule(
			this.resolveParticipantSize(attacker, defaultSize),
			this.resolveParticipantSize(target, defaultSize)
		);
	}

	async updateParticipant(
		id: string,
		participantId: string,
		userId: string,
		dto: UpdateCombatParticipantDto
	) {
		const encounter = await this.findEncounter(id);
		await this.assertCampaignGm(encounter.campaignId, userId);

		const participant = await this.prisma.combatEncounterParticipant.findFirst({
			select: { id: true },
			where: {
				id: participantId,
				encounterId: id
			}
		});

		if (!participant) {
			throw new NotFoundException('Участник столкновения не найден.');
		}

		await this.prisma.combatEncounterParticipant.update({
			where: { id: participantId },
			data: {
				sceneName: dto.sceneName?.trim(),
				currentHealth: dto.currentHealth,
				currentPotential: dto.currentPotential,
				initiative: dto.initiative,
				isActive: dto.isActive
			}
		});

		return this.getEncounter(id, userId);
	}

	private async findEncounter(id: string) {
		const encounter = await this.prisma.combatEncounter.findUnique({
			select: combatEncounterSelect,
			where: { id }
		});

		if (!encounter || !encounter.isActive) {
			throw new NotFoundException('Столкновение не найдено.');
		}

		return encounter;
	}

	private async getActiveCampaignMember(campaignId: string, userId: string) {
		const member = await this.prisma.campaignMember.findUnique({
			select: { role: true, status: true },
			where: {
				campaignId_userId: {
					campaignId,
					userId
				}
			}
		});

		if (!member || member.status !== CampaignMemberStatus.ACTIVE) {
			throw new ForbiddenException('Вы не состоите в этой кампании.');
		}

		return member;
	}

	private async assertCampaignGm(campaignId: string, userId: string) {
		const member = await this.getActiveCampaignMember(campaignId, userId);

		if (member.role !== CampaignMemberRole.GM) {
			throw new ForbiddenException(
				'Создавать столкновения может только мастер кампании.'
			);
		}
	}

	private async getNextParticipantSortOrder(encounterId: string) {
		const lastParticipant =
			await this.prisma.combatEncounterParticipant.findFirst({
				select: { sortOrder: true },
				where: { encounterId },
				orderBy: { sortOrder: 'desc' }
			});

		return (lastParticipant?.sortOrder ?? -1) + 1;
	}

	private findParticipantForSizeRule(
		encounterId: string,
		participantId: string
	) {
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

	private resolveParticipantSize(
		participant: NonNullable<
			Awaited<ReturnType<CombatEncountersService['findParticipantForSizeRule']>>
		>,
		defaultSize: { id: string; name: string; rank: number } | null
	): CombatSizeRuleSize {
		const size = participant.creatureTier?.size ?? defaultSize;

		return {
			id: size?.id ?? null,
			name: size?.name ?? 'Средний',
			rank: size?.rank ?? 2,
			source: participant.creatureTier?.size ? 'creature_tier' : 'default'
		};
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

	private createCreatureSceneName(
		baseName: string,
		count: number,
		index: number
	) {
		return count > 1 ? `${baseName} ${index + 1}` : baseName;
	}

	private mapEncounter(encounter: CombatEncounterRecord) {
		return {
			id: encounter.id,
			campaignId: encounter.campaignId,
			name: encounter.name,
			status: encounter.status,
			isActive: encounter.isActive,
			participants: encounter.participants.map(participant => ({
				id: participant.id,
				kind: participant.kind,
				playerCharacterId: participant.playerCharacterId,
				playerCharacter: participant.playerCharacter
					? {
							id: participant.playerCharacter.id,
							name: participant.playerCharacter.name,
							owner: {
								id: participant.playerCharacter.ownerUser.id,
								displayUsername:
									participant.playerCharacter.ownerUser.displayUsername,
								username: participant.playerCharacter.ownerUser.username
							}
						}
					: null,
				creatureId: participant.creatureId,
				creature: participant.creature,
				creatureTierId: participant.creatureTierId,
				creatureTier: participant.creatureTier,
				sceneName: participant.sceneName,
				currentHealth: participant.currentHealth,
				currentPotential: participant.currentPotential,
				initiative: participant.initiative,
				isActive: participant.isActive,
				sortOrder: participant.sortOrder,
				createdAt: participant.createdAt.toISOString(),
				updatedAt: participant.updatedAt.toISOString()
			})),
			createdAt: encounter.createdAt.toISOString(),
			updatedAt: encounter.updatedAt.toISOString()
		};
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
