import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { PrismaService } from '../../prisma/prisma.service';
import { CombatEncounterRepositoryPort } from '../application/combat-encounter-repository.port';
import { combatEncounterStatuses } from '../domain/combat-encounter.types';
import { UpdateCombatEncounterDto } from '../dto/update-combat-encounter.dto';

const combatEncounterSelect = {
	id: true,
	campaignId: true,
	campaign: {
		select: {
			combatActionResolutionMode: true
		}
	},
	name: true,
	status: true,
	stateVersion: true,
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
					name: true,
					actions: true,
					naturalAttackLinks: {
						select: {
							id: true,
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
						},
						orderBy: [{ sortOrder: 'asc' }]
					}
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
					actions: true,
					actionOverrides: true,
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
			conditions: {
				select: {
					id: true,
					conditionId: true,
					condition: {
						select: {
							id: true,
							slug: true,
							name: true
						}
					},
					displayName: true,
					level: true,
					sourceParticipantId: true,
					sourceActionSlug: true,
					metadata: true,
					isActive: true,
					createdAt: true,
					updatedAt: true
				},
				where: { isActive: true },
				orderBy: [{ createdAt: 'asc' }]
			},
			createdAt: true,
			updatedAt: true
		},
		orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
	},
	conditionLinks: {
		select: {
			id: true,
			sourceParticipantId: true,
			targetParticipantId: true,
			sourceConditionId: true,
			sourceCondition: {
				select: {
					id: true,
					slug: true,
					name: true
				}
			},
			targetConditionId: true,
			targetCondition: {
				select: {
					id: true,
					slug: true,
					name: true
				}
			},
			sourceConditionInstanceId: true,
			targetConditionInstanceId: true,
			sourceActionSlug: true,
			metadata: true,
			isActive: true,
			createdAt: true,
			updatedAt: true
		},
		where: { isActive: true },
		orderBy: [{ createdAt: 'asc' }]
	},
	events: {
		select: {
			id: true,
			createdByUserId: true,
			actorParticipantId: true,
			targetParticipantId: true,
			type: true,
			actionSlug: true,
			payload: true,
			createdAt: true
		},
		orderBy: [{ createdAt: 'desc' }],
		take: 30
	},
	defenseRequests: {
		select: {
			id: true,
			actorParticipantId: true,
			targetParticipantId: true,
			createdByUserId: true,
			actionSlug: true,
			actionSnapshot: true,
			attackRoll: true,
			defenseOptions: true,
			status: true,
			resolvedByUserId: true,
			resolvedAt: true,
			resolution: true,
			createdAt: true,
			updatedAt: true
		},
		where: { status: 'pending' },
		orderBy: [{ createdAt: 'asc' }]
	},
	declaredActions: {
		select: {
			id: true,
			actorParticipantId: true,
			targetParticipantId: true,
			createdByUserId: true,
			actionSlug: true,
			actionSnapshot: true,
			declaredAtPotential: true,
			resolveAtPotential: true,
			status: true,
			resolvedByUserId: true,
			resolvedAt: true,
			resolution: true,
			createdAt: true,
			updatedAt: true
		},
		where: { status: { in: ['pending', 'waiting_defense'] } },
		orderBy: [{ resolveAtPotential: 'desc' }, { createdAt: 'asc' }]
	}
} satisfies Prisma.CombatEncounterSelect;

const combatEncounterSummarySelect = {
	id: true,
	campaignId: true,
	name: true,
	status: true,
	isActive: true,
	createdAt: true,
	updatedAt: true,
	_count: {
		select: {
			participants: {
				where: {
					isActive: true
				}
			}
		}
	}
} satisfies Prisma.CombatEncounterSelect;

type CombatEncounterRecord = Prisma.CombatEncounterGetPayload<{
	select: typeof combatEncounterSelect;
}>;

type CombatEncounterSummaryRecord = Prisma.CombatEncounterGetPayload<{
	select: typeof combatEncounterSummarySelect;
}>;

@Injectable()
export class CombatEncounterRepository
	implements CombatEncounterRepositoryPort
{
	constructor(private readonly prisma: PrismaService) {}

	findActiveSummariesByCampaign(campaignId: string) {
		return this.prisma.combatEncounter.findMany({
			select: combatEncounterSummarySelect,
			where: {
				campaignId,
				isActive: true
			},
			orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }]
		});
	}

	createDraft(input: { campaignId: string; name: string }) {
		return this.prisma.combatEncounter.create({
			select: combatEncounterSelect,
			data: {
				campaignId: input.campaignId,
				name: input.name,
				status: combatEncounterStatuses.draft
			}
		});
	}

	updateStatus(id: string, dto: UpdateCombatEncounterDto) {
		return this.prisma.combatEncounter.update({
			where: { id },
			data: {
				status: dto.status
			}
		});
	}

	incrementStateVersion(id: string) {
		return this.prisma.combatEncounter.update({
			where: { id },
			data: {
				stateVersion: { increment: 1 }
			}
		});
	}

	findStateVersion(id: string) {
		return this.prisma.combatEncounter.findUnique({
			select: { stateVersion: true },
			where: { id }
		});
	}

	async findActiveById(id: string) {
		const encounter = await this.prisma.combatEncounter.findUnique({
			select: combatEncounterSelect,
			where: { id }
		});

		if (!encounter || !encounter.isActive) {
			throw new NotFoundException('Столкновение не найдено.');
		}

		return encounter;
	}
}
