import {
	BadRequestException,
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
	CombatActionCheckRuntimeService,
	CombatActionDefenseConfig,
	CombatActionRollConfig,
	CombatDefenseOption,
	CombatResolvedRoll
} from './combat-action-check-runtime.service';
import {
	CombatSizeRuleSize,
	resolveKnockdownSizeRule
} from './combat-size-rules';
import { AddCreatureParticipantDto } from './dto/add-creature-participant.dto';
import { AddPlayerCharacterParticipantDto } from './dto/add-player-character-participant.dto';
import { CreateCombatEncounterDto } from './dto/create-combat-encounter.dto';
import {
	ExecuteCombatActionDto,
	ResolveDeclaredCombatActionDto,
	ResolveCombatDefenseDto
} from './dto/execute-combat-action.dto';
import { KnockdownSizeRuleQueryDto } from './dto/knockdown-size-rule-query.dto';
import { UpdateCombatEncounterDto } from './dto/update-combat-encounter.dto';
import { UpdateCombatParticipantDto } from './dto/update-combat-participant.dto';
import { CombatEncounterRealtimeService } from './combat-encounter-realtime.service';

const HEALTH_VALUE_NAME = 'Здоровье';
const POTENTIAL_VALUE_NAME = 'Потенциал';

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

interface RuntimeActionReference {
	name: string;
	slug: string;
}

interface RuntimeActionSource {
	type: string;
	name: string;
	slug: string;
	profileName: string;
	intent: RuntimeActionReference | null;
}

interface RuntimeActionEffect {
	type: string;
	value?: number | null;
	damageMode?:
		| 'clean_successes'
		| 'clean_successes_plus_base'
		| 'base_damage'
		| null;
	damageType?: RuntimeActionReference | null;
	condition?: RuntimeActionReference | null;
	linkedCondition?: RuntimeActionReference | null;
	conditionDisplayName?: string | null;
	conditionLevel?: number | null;
	targetScope?: string | null;
	requiresDamageAfterArmor?: boolean;
	text?: string | null;
	sortOrder?: number | null;
}

interface RuntimeActionRoll extends CombatActionRollConfig {}

interface RuntimeActionDefense extends CombatActionDefenseConfig {}

interface RuntimeAction {
	slug: string;
	name: string;
	kind: string;
	source?: RuntimeActionSource | null;
	cost?: {
		mode?: string;
		potential?: number | null;
	};
	target?: {
		type?: string;
	};
	roll?: RuntimeActionRoll | null;
	defense?: RuntimeActionDefense | null;
	effects?: RuntimeActionEffect[];
	isActive?: boolean;
	sortOrder?: number | null;
}

interface AppliedRuntimeState {
	lastDamageAfterArmor: number;
	conditionInstances: Map<string, string>;
	linkedTargetParticipantId: string | null;
	events: Prisma.InputJsonObject[];
}

@Injectable()
export class CombatEncountersService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly systemValueRuntime: SystemValueRuntimeService,
		private readonly actionCheckRuntime: CombatActionCheckRuntimeService,
		private readonly realtime: CombatEncounterRealtimeService
	) {}

	async getCampaignEncounters(campaignId: string, userId: string) {
		await this.getActiveCampaignMember(campaignId, userId);

		const encounters = await this.prisma.combatEncounter.findMany({
			select: combatEncounterSummarySelect,
			where: {
				campaignId,
				isActive: true
			},
			orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }]
		});

		return {
			encounters: encounters.map(encounter =>
				this.mapEncounterSummary(encounter)
			)
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

		return this.mapEncounter(encounter, CampaignMemberRole.GM);
	}

	async getEncounter(id: string, userId: string) {
		const encounter = await this.findEncounter(id);
		const member = await this.getActiveCampaignMember(
			encounter.campaignId,
			userId
		);
		return this.mapEncounter(encounter, member.role);
	}

	async updateEncounter(
		id: string,
		userId: string,
		dto: UpdateCombatEncounterDto
	) {
		const encounter = await this.findEncounter(id);
		await this.assertCampaignGm(encounter.campaignId, userId);

		await this.prisma.combatEncounter.update({
			where: { id },
			data: {
				status: dto.status
			}
		});

		return this.publishAndReturnEncounter(id, userId);
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

		return this.publishAndReturnEncounter(id, userId);
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
		const initialPotential = await this.resolveCreatureInitialPotential(tier);

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
						currentPotential: initialPotential,
						sortOrder: startSortOrder + index
					}
				})
			)
		);

		return this.publishAndReturnEncounter(id, userId);
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

		return this.publishAndReturnEncounter(id, userId);
	}

	async skipParticipantTurn(id: string, participantId: string, userId: string) {
		const encounter = await this.findEncounter(id);
		const member = await this.getActiveCampaignMember(
			encounter.campaignId,
			userId
		);

		if (encounter.status !== CombatEncounterStatus.ACTIVE) {
			throw new BadRequestException('Пропуск хода доступен только в бою.');
		}

		const participant = encounter.participants.find(
			item => item.id === participantId
		);

		if (!participant || !participant.isActive) {
			throw new NotFoundException('Участник столкновения не найден.');
		}

		if (
			member.role !== CampaignMemberRole.GM &&
			participant.playerCharacter?.ownerUser.id !== userId
		) {
			throw new ForbiddenException('Недостаточно прав для этого действия.');
		}

		if (
			encounter.declaredActions.some(
				action =>
					action.status === 'pending' &&
					this.canResolveDeclaredAction(encounter, action)
			)
		) {
			throw new BadRequestException(
				'Сначала нужно разыграть заявленное действие.'
			);
		}

		const activeParticipant = this.resolveActiveParticipant(encounter);

		if (!activeParticipant || activeParticipant.id !== participantId) {
			throw new BadRequestException('Сейчас ход другого участника.');
		}

		const nextPotential = this.resolvePotentialAfterSkip(
			encounter,
			participantId
		);

		await this.prisma.$transaction(async tx => {
			await tx.combatEncounterParticipant.update({
				where: { id: participantId },
				data: {
					currentPotential: nextPotential
				}
			});
			await tx.combatEncounterEvent.create({
				data: {
					encounterId: id,
					createdByUserId: userId,
					actorParticipantId: participantId,
					targetParticipantId: null,
					type: 'turn_skipped',
					actionSlug: null,
					payload: {
						participantName: participant.sceneName,
						fromPotential: participant.currentPotential,
						toPotential: nextPotential
					} as unknown as Prisma.InputJsonValue
				}
			});
		});

		return this.publishAndReturnEncounter(id, userId);
	}

	async executeAction(id: string, userId: string, dto: ExecuteCombatActionDto) {
		const encounter = await this.findEncounter(id);
		await this.assertCampaignGm(encounter.campaignId, userId);

		const actor = await this.prisma.combatEncounterParticipant.findFirst({
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
				id: dto.actorParticipantId,
				encounterId: id,
				isActive: true
			}
		});

		if (!actor) {
			throw new NotFoundException('Исполнитель действия не найден.');
		}

		const action = this.findParticipantAction(actor, dto.actionSlug);

		if (!action || action.isActive === false) {
			throw new NotFoundException('Действие участника не найдено.');
		}

		const targetParticipantId =
			action.target?.type === 'self'
				? actor.id
				: (dto.targetParticipantId ?? null);

		if (this.actionRequiresSelectedTarget(action) && !targetParticipantId) {
			throw new BadRequestException('Для действия нужно выбрать цель.');
		}

		if (targetParticipantId) {
			await this.assertEncounterParticipant(id, targetParticipantId);
		}

		if (this.resolveCampaignActionResolutionMode(encounter) === 'delayed') {
			await this.prisma.$transaction(async tx => {
				await this.spendActionPotential(tx, actor, action);
				const resolveAtPotential = this.resolveActionPotentialAfterCost(
					actor,
					action
				);

				await tx.combatEncounterDeclaredAction.create({
					data: {
						encounterId: id,
						actorParticipantId: actor.id,
						targetParticipantId,
						createdByUserId: userId,
						actionSlug: action.slug,
						actionSnapshot: action as unknown as Prisma.InputJsonValue,
						declaredAtPotential: actor.currentPotential,
						resolveAtPotential
					}
				});
				await tx.combatEncounterEvent.create({
					data: {
						encounterId: id,
						createdByUserId: userId,
						actorParticipantId: actor.id,
						targetParticipantId,
						type: 'action_declared',
						actionSlug: action.slug,
						payload: {
							actionName: action.name,
							declaredAtPotential: actor.currentPotential,
							resolveAtPotential
						} as unknown as Prisma.InputJsonValue
					}
				});
			});

			return this.publishAndReturnEncounter(id, userId);
		}

		await this.resolveActionNow(id, userId, {
			actor,
			targetParticipantId,
			action
		});

		return this.publishAndReturnEncounter(id, userId);
	}

	async resolveDeclaredAction(
		id: string,
		userId: string,
		dto: ResolveDeclaredCombatActionDto
	) {
		const encounter = await this.findEncounter(id);
		await this.assertCampaignGm(encounter.campaignId, userId);

		const declaredAction =
			await this.prisma.combatEncounterDeclaredAction.findFirst({
				select: {
					id: true,
					actorParticipantId: true,
					targetParticipantId: true,
					actionSlug: true,
					actionSnapshot: true,
					resolveAtPotential: true,
					actorParticipant: {
						select: {
							id: true,
							encounterId: true,
							currentPotential: true
						}
					}
				},
				where: {
					id: dto.declaredActionId,
					encounterId: id,
					status: 'pending'
				}
			});

		if (!declaredAction) {
			throw new NotFoundException('Заявленное действие не найдено.');
		}

		if (!this.canResolveDeclaredAction(encounter, declaredAction)) {
			throw new BadRequestException(
				'Это действие еще не дошло до своей точки разрешения.'
			);
		}

		const action = this.readRuntimeAction(declaredAction.actionSnapshot);

		if (!action) {
			throw new BadRequestException('В заявке повреждено действие.');
		}

		await this.prisma.combatEncounterDeclaredAction.update({
			where: { id: declaredAction.id },
			data: { status: 'resolving' }
		});

		try {
			await this.resolveActionNow(id, userId, {
				actor: declaredAction.actorParticipant,
				targetParticipantId: declaredAction.targetParticipantId,
				action,
				declaredActionId: declaredAction.id
			});
		} catch (error) {
			await this.prisma.combatEncounterDeclaredAction.update({
				where: { id: declaredAction.id },
				data: { status: 'pending' }
			});
			throw error;
		}

		return this.publishAndReturnEncounter(id, userId);
	}

	private async resolveActionNow(
		id: string,
		userId: string,
		input: {
			actor: { id: string; currentPotential: number };
			targetParticipantId: string | null;
			action: RuntimeAction;
			declaredActionId?: string;
		}
	) {
		const { actor, targetParticipantId, action, declaredActionId } = input;
		const attackRoll = await this.actionCheckRuntime.rollActionAttack(
			actor.id,
			action
		);
		const defenseOptions = targetParticipantId
			? await this.actionCheckRuntime.resolveDefenseOptions({
					actorParticipantId: actor.id,
					targetParticipantId,
					action
				})
			: [];
		const target = targetParticipantId
			? await this.prisma.combatEncounterParticipant.findUnique({
					select: {
						id: true,
						kind: true,
						playerCharacter: {
							select: {
								ownerUserId: true
							}
						}
					},
					where: { id: targetParticipantId }
				})
			: null;
		const shouldRequestPlayerDefense =
			!!attackRoll &&
			!!targetParticipantId &&
			!!target?.playerCharacter &&
			defenseOptions.some(option => option.mode !== 'none');

		if (shouldRequestPlayerDefense) {
			await this.prisma.$transaction(async tx => {
				if (!declaredActionId) {
					await this.spendActionPotential(tx, actor, action);
				}
				await tx.combatEncounterDefenseRequest.create({
					data: {
						encounterId: id,
						actorParticipantId: actor.id,
						targetParticipantId,
						createdByUserId: userId,
						actionSlug: action.slug,
						actionSnapshot: action as unknown as Prisma.InputJsonValue,
						attackRoll: attackRoll as unknown as Prisma.InputJsonValue,
						defenseOptions: defenseOptions as unknown as Prisma.InputJsonValue,
						resolution: declaredActionId
							? ({
									declaredActionId
								} as unknown as Prisma.InputJsonValue)
							: undefined
					}
				});
				if (declaredActionId) {
					await tx.combatEncounterDeclaredAction.update({
						where: { id: declaredActionId },
						data: { status: 'waiting_defense' }
					});
				}
				await tx.combatEncounterEvent.create({
					data: {
						encounterId: id,
						createdByUserId: userId,
						actorParticipantId: actor.id,
						targetParticipantId,
						type: 'defense_requested',
						actionSlug: action.slug,
						payload: {
							actionName: action.name,
							attackRoll,
							defenseOptions
						} as unknown as Prisma.InputJsonValue
					}
				});
			});

			return;
		}

		const automaticDefense = defenseOptions.find(
			option => option.mode !== 'none'
		);
		const defenseRoll = automaticDefense
			? await this.actionCheckRuntime.rollDefense({
					participantId: targetParticipantId ?? actor.id,
					option: automaticDefense
				})
			: null;
		const result = this.resolveCombatActionResult(attackRoll, defenseRoll);

		const state: AppliedRuntimeState = {
			lastDamageAfterArmor: 0,
			conditionInstances: new Map<string, string>(),
			linkedTargetParticipantId: null,
			events: []
		};

		await this.prisma.$transaction(async tx => {
			if (!declaredActionId) {
				await this.spendActionPotential(tx, actor, action);
			}

			for (const effect of [...(action.effects ?? [])].sort(
				(first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0)
			)) {
				if (attackRoll && result.cleanSuccesses <= 0) {
					continue;
				}

				if (
					effect.requiresDamageAfterArmor &&
					state.lastDamageAfterArmor <= 0
				) {
					continue;
				}

				await this.applyActionEffect(tx, {
					encounterId: id,
					actorParticipantId: actor.id,
					selectedTargetParticipantId: targetParticipantId,
					action,
					effect,
					result,
					state
				});
			}

			await tx.combatEncounterEvent.create({
				data: {
					encounterId: id,
					createdByUserId: userId,
					actorParticipantId: actor.id,
					targetParticipantId,
					type: 'action_executed',
					actionSlug: action.slug,
					payload: {
						actionName: action.name,
						result,
						attackRoll,
						defenseRoll,
						defense: automaticDefense ?? null,
						effects: state.events
					} as unknown as Prisma.InputJsonValue
				}
			});
			if (declaredActionId) {
				await tx.combatEncounterDeclaredAction.update({
					where: { id: declaredActionId },
					data: {
						status: 'resolved',
						resolvedByUserId: userId,
						resolvedAt: new Date(),
						resolution: {
							result,
							attackRoll,
							defenseRoll,
							defense: automaticDefense ?? null,
							effects: state.events
						} as unknown as Prisma.InputJsonValue
					}
				});
			}
		});
	}

	async resolveDefense(
		id: string,
		userId: string,
		dto: ResolveCombatDefenseDto
	) {
		const encounter = await this.findEncounter(id);
		await this.getActiveCampaignMember(encounter.campaignId, userId);

		const request = await this.prisma.combatEncounterDefenseRequest.findFirst({
			select: {
				id: true,
				actorParticipantId: true,
				targetParticipantId: true,
				actionSlug: true,
				actionSnapshot: true,
				attackRoll: true,
				defenseOptions: true,
				resolution: true,
				targetParticipant: {
					select: {
						playerCharacter: {
							select: {
								ownerUserId: true
							}
						}
					}
				}
			},
			where: {
				id: dto.defenseRequestId,
				encounterId: id,
				status: 'pending'
			}
		});

		if (!request) {
			throw new NotFoundException('Запрос защиты не найден.');
		}

		if (request.targetParticipant.playerCharacter?.ownerUserId !== userId) {
			await this.assertCampaignGm(encounter.campaignId, userId);
		}

		const action = this.readRuntimeAction(request.actionSnapshot);

		if (!action) {
			throw new BadRequestException('В запросе защиты повреждено действие.');
		}

		const defenseOptions = this.readDefenseOptions(request.defenseOptions);
		const defense = await this.actionCheckRuntime.resolveSelectedDefenseOption({
			options: defenseOptions,
			mode: dto.mode,
			skillSlug: dto.skillSlug
		});
		const attackRoll = this.readResolvedRoll(request.attackRoll);
		const declaredActionId = this.readDeclaredActionId(request.resolution);
		const defenseRoll = await this.actionCheckRuntime.rollDefense({
			participantId: request.targetParticipantId,
			option: defense
		});
		const result = this.resolveCombatActionResult(attackRoll, defenseRoll);
		const state: AppliedRuntimeState = {
			lastDamageAfterArmor: 0,
			conditionInstances: new Map<string, string>(),
			linkedTargetParticipantId: null,
			events: []
		};

		await this.prisma.$transaction(async tx => {
			for (const effect of [...(action.effects ?? [])].sort(
				(first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0)
			)) {
				if (attackRoll && result.cleanSuccesses <= 0) {
					continue;
				}

				if (
					effect.requiresDamageAfterArmor &&
					state.lastDamageAfterArmor <= 0
				) {
					continue;
				}

				await this.applyActionEffect(tx, {
					encounterId: id,
					actorParticipantId: request.actorParticipantId,
					selectedTargetParticipantId: request.targetParticipantId,
					action,
					effect,
					result,
					state
				});
			}

			await tx.combatEncounterDefenseRequest.update({
				where: { id: request.id },
				data: {
					status: 'resolved',
					resolvedByUserId: userId,
					resolvedAt: new Date(),
					resolution: {
						defense,
						defenseRoll,
						result,
						effects: state.events
					} as unknown as Prisma.InputJsonValue
				}
			});
			await tx.combatEncounterEvent.create({
				data: {
					encounterId: id,
					createdByUserId: userId,
					actorParticipantId: request.actorParticipantId,
					targetParticipantId: request.targetParticipantId,
					type: 'action_resolved',
					actionSlug: action.slug,
					payload: {
						actionName: action.name,
						attackRoll,
						defense,
						defenseRoll,
						result,
						effects: state.events
					} as unknown as Prisma.InputJsonValue
				}
			});
			if (declaredActionId) {
				await tx.combatEncounterDeclaredAction.update({
					where: { id: declaredActionId },
					data: {
						status: 'resolved',
						resolvedByUserId: userId,
						resolvedAt: new Date(),
						resolution: {
							defense,
							defenseRoll,
							result,
							effects: state.events
						} as unknown as Prisma.InputJsonValue
					}
				});
			}
		});

		return this.publishAndReturnEncounter(id, userId);
	}

	private async spendActionPotential(
		tx: Prisma.TransactionClient,
		actor: { id: string; currentPotential: number },
		action: RuntimeAction
	) {
		const potentialCost =
			action.cost?.mode === 'fixed' ? (action.cost.potential ?? 0) : 0;

		if (potentialCost <= 0) {
			return;
		}

		await tx.combatEncounterParticipant.update({
			where: { id: actor.id },
			data: {
				currentPotential: Math.max(0, actor.currentPotential - potentialCost)
			}
		});
	}

	private resolveActionPotentialAfterCost(
		actor: { currentPotential: number },
		action: RuntimeAction
	) {
		const potentialCost =
			action.cost?.mode === 'fixed' ? (action.cost.potential ?? 0) : 0;
		return Math.max(0, actor.currentPotential - Math.max(0, potentialCost));
	}

	private canResolveDeclaredAction(
		encounter: CombatEncounterRecord,
		declaredAction: { resolveAtPotential: number }
	) {
		const highestParticipantPotential = encounter.participants.reduce(
			(highest, participant) =>
				participant.isActive
					? Math.max(highest, participant.currentPotential)
					: highest,
			0
		);

		return highestParticipantPotential <= declaredAction.resolveAtPotential;
	}

	private resolveActiveParticipant(encounter: CombatEncounterRecord) {
		return [...encounter.participants]
			.filter(
				participant => participant.isActive && participant.currentPotential > 0
			)
			.sort(
				(left, right) =>
					right.currentPotential - left.currentPotential ||
					left.sortOrder - right.sortOrder
			)[0];
	}

	private resolvePotentialAfterSkip(
		encounter: CombatEncounterRecord,
		participantId: string
	) {
		const nextParticipant = [...encounter.participants]
			.filter(
				participant =>
					participant.isActive &&
					participant.id !== participantId &&
					participant.currentPotential > 0
			)
			.sort(
				(left, right) =>
					right.currentPotential - left.currentPotential ||
					left.sortOrder - right.sortOrder
			)[0];

		return nextParticipant
			? Math.max(0, nextParticipant.currentPotential - 1)
			: 0;
	}

	private resolveCampaignActionResolutionMode(
		encounter: CombatEncounterRecord
	): 'delayed' | 'immediate' {
		return encounter.campaign.combatActionResolutionMode === 'immediate'
			? 'immediate'
			: 'delayed';
	}

	private resolveCombatActionResult(
		attackRoll: CombatResolvedRoll | null,
		defenseRoll: CombatResolvedRoll | null
	) {
		if (!attackRoll) {
			return { cleanSuccesses: 0 };
		}

		return {
			cleanSuccesses: Math.max(
				0,
				attackRoll.successes - (defenseRoll?.successes ?? 0)
			)
		};
	}

	private async publishAndReturnEncounter(id: string, userId: string) {
		const updatedEncounter = await this.getEncounter(id, userId);
		this.realtime.publishEncounterUpdated(id, updatedEncounter);
		return updatedEncounter;
	}

	private async assertEncounterParticipant(
		encounterId: string,
		participantId: string
	) {
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

	private async applyActionEffect(
		tx: Prisma.TransactionClient,
		input: {
			encounterId: string;
			actorParticipantId: string;
			selectedTargetParticipantId: string | null;
			action: RuntimeAction;
			effect: RuntimeActionEffect;
			result: { cleanSuccesses?: number };
			state: AppliedRuntimeState;
		}
	) {
		switch (input.effect.type) {
			case 'damage':
				await this.applyDamageEffect(tx, input);
				return;
			case 'apply_condition':
				await this.applyConditionEffect(tx, input);
				return;
			case 'remove_condition':
				await this.removeConditionEffect(tx, input);
				return;
			case 'link_condition':
				await this.linkConditionEffect(tx, input);
				return;
			case 'unlink_condition':
				await this.unlinkConditionEffect(tx, input);
				return;
			case 'move_linked_target':
				await this.moveLinkedTargetEffect(input);
				return;
			case 'special_rule':
			case 'dice_pool_modifier':
				input.state.events.push({
					type: input.effect.type,
					text: input.effect.text ?? ''
				});
				return;
			default:
				input.state.events.push({
					type: 'unsupported_effect',
					effectType: input.effect.type
				});
		}
	}

	private async applyDamageEffect(
		tx: Prisma.TransactionClient,
		input: {
			actorParticipantId: string;
			selectedTargetParticipantId: string | null;
			effect: RuntimeActionEffect;
			result: { cleanSuccesses?: number };
			state: AppliedRuntimeState;
		}
	) {
		const targetParticipantId = await this.resolveEffectTargetParticipantId(
			tx,
			{
				actorParticipantId: input.actorParticipantId,
				selectedTargetParticipantId: input.selectedTargetParticipantId,
				effect: input.effect
			}
		);
		const damage = this.resolveDamage(input.effect, input.result);

		if (!targetParticipantId || damage <= 0) {
			input.state.lastDamageAfterArmor = 0;
			return;
		}

		const target = await tx.combatEncounterParticipant.findUnique({
			select: { currentHealth: true },
			where: { id: targetParticipantId }
		});

		if (!target) {
			throw new NotFoundException('Цель эффекта не найдена.');
		}

		await tx.combatEncounterParticipant.update({
			where: { id: targetParticipantId },
			data: {
				currentHealth: Math.max(0, target.currentHealth - damage)
			}
		});

		input.state.lastDamageAfterArmor = damage;
		input.state.events.push({
			type: 'damage',
			targetParticipantId,
			value: damage,
			damageType: input.effect.damageType?.slug ?? null
		});
	}

	private async applyConditionEffect(
		tx: Prisma.TransactionClient,
		input: {
			encounterId: string;
			actorParticipantId: string;
			selectedTargetParticipantId: string | null;
			action: RuntimeAction;
			effect: RuntimeActionEffect;
			state: AppliedRuntimeState;
		}
	) {
		if (!input.effect.condition?.slug) {
			return;
		}

		const targetParticipantId = await this.resolveEffectTargetParticipantId(
			tx,
			{
				actorParticipantId: input.actorParticipantId,
				selectedTargetParticipantId: input.selectedTargetParticipantId,
				effect: input.effect
			}
		);

		if (!targetParticipantId) {
			return;
		}

		const condition = await this.findConditionBySlug(
			input.effect.condition.slug
		);
		const instance = await tx.combatEncounterParticipantCondition.create({
			data: {
				encounterId: input.encounterId,
				participantId: targetParticipantId,
				conditionId: condition.id,
				displayName: input.effect.conditionDisplayName?.trim() || null,
				level: input.effect.conditionLevel ?? input.effect.value ?? 1,
				sourceParticipantId: input.actorParticipantId,
				sourceActionSlug: input.action.slug,
				metadata: {} as Prisma.InputJsonValue
			}
		});

		input.state.conditionInstances.set(
			this.conditionInstanceKey(targetParticipantId, condition.id),
			instance.id
		);
		input.state.events.push({
			type: 'condition_applied',
			targetParticipantId,
			conditionId: condition.id,
			conditionSlug: condition.slug,
			level: instance.level
		});
	}

	private async removeConditionEffect(
		tx: Prisma.TransactionClient,
		input: {
			actorParticipantId: string;
			selectedTargetParticipantId: string | null;
			effect: RuntimeActionEffect;
			state: AppliedRuntimeState;
		}
	) {
		if (!input.effect.condition?.slug) {
			return;
		}

		const targetParticipantId = await this.resolveEffectTargetParticipantId(
			tx,
			{
				actorParticipantId: input.actorParticipantId,
				selectedTargetParticipantId: input.selectedTargetParticipantId,
				effect: input.effect
			}
		);

		if (!targetParticipantId) {
			return;
		}

		const condition = await this.findConditionBySlug(
			input.effect.condition.slug
		);
		const result = await tx.combatEncounterParticipantCondition.updateMany({
			where: {
				participantId: targetParticipantId,
				conditionId: condition.id,
				isActive: true
			},
			data: { isActive: false }
		});

		input.state.events.push({
			type: 'condition_removed',
			targetParticipantId,
			conditionId: condition.id,
			conditionSlug: condition.slug,
			count: result.count
		});
	}

	private async linkConditionEffect(
		tx: Prisma.TransactionClient,
		input: {
			encounterId: string;
			actorParticipantId: string;
			selectedTargetParticipantId: string | null;
			action: RuntimeAction;
			effect: RuntimeActionEffect;
			state: AppliedRuntimeState;
		}
	) {
		if (
			!input.selectedTargetParticipantId ||
			!input.effect.condition?.slug ||
			!input.effect.linkedCondition?.slug
		) {
			return;
		}

		const [sourceCondition, targetCondition] = await Promise.all([
			this.findConditionBySlug(input.effect.condition.slug),
			this.findConditionBySlug(input.effect.linkedCondition.slug)
		]);
		const sourceConditionInstanceId = await this.resolveConditionInstanceId(
			tx,
			{
				participantId: input.actorParticipantId,
				conditionId: sourceCondition.id,
				state: input.state
			}
		);
		const targetConditionInstanceId = await this.resolveConditionInstanceId(
			tx,
			{
				participantId: input.selectedTargetParticipantId,
				conditionId: targetCondition.id,
				state: input.state
			}
		);

		await tx.combatEncounterConditionLink.create({
			data: {
				encounterId: input.encounterId,
				sourceParticipantId: input.actorParticipantId,
				targetParticipantId: input.selectedTargetParticipantId,
				sourceConditionId: sourceCondition.id,
				targetConditionId: targetCondition.id,
				sourceConditionInstanceId,
				targetConditionInstanceId,
				sourceActionSlug: input.action.slug,
				metadata: {} as Prisma.InputJsonValue
			}
		});

		input.state.linkedTargetParticipantId = input.selectedTargetParticipantId;
		input.state.events.push({
			type: 'conditions_linked',
			sourceParticipantId: input.actorParticipantId,
			targetParticipantId: input.selectedTargetParticipantId,
			sourceConditionSlug: sourceCondition.slug,
			targetConditionSlug: targetCondition.slug
		});
	}

	private async unlinkConditionEffect(
		tx: Prisma.TransactionClient,
		input: {
			actorParticipantId: string;
			effect: RuntimeActionEffect;
			state: AppliedRuntimeState;
		}
	) {
		if (!input.effect.condition?.slug) {
			return;
		}

		const sourceCondition = await this.findConditionBySlug(
			input.effect.condition.slug
		);
		const targetCondition = input.effect.linkedCondition?.slug
			? await this.findConditionBySlug(input.effect.linkedCondition.slug)
			: null;
		const link = await tx.combatEncounterConditionLink.findFirst({
			select: { id: true, targetParticipantId: true },
			where: {
				sourceParticipantId: input.actorParticipantId,
				sourceConditionId: sourceCondition.id,
				targetConditionId: targetCondition?.id,
				isActive: true
			},
			orderBy: { createdAt: 'desc' }
		});

		if (!link) {
			return;
		}

		await tx.combatEncounterConditionLink.update({
			where: { id: link.id },
			data: { isActive: false }
		});

		input.state.linkedTargetParticipantId = link.targetParticipantId;
		input.state.events.push({
			type: 'conditions_unlinked',
			linkId: link.id,
			targetParticipantId: link.targetParticipantId,
			sourceConditionSlug: sourceCondition.slug,
			targetConditionSlug: targetCondition?.slug ?? null
		});
	}

	private async moveLinkedTargetEffect(input: {
		actorParticipantId: string;
		effect: RuntimeActionEffect;
		state: AppliedRuntimeState;
	}) {
		input.state.events.push({
			type: 'move_linked_target',
			targetParticipantId: input.state.linkedTargetParticipantId,
			sourceConditionSlug: input.effect.condition?.slug ?? null,
			value: input.effect.value ?? null
		});
	}

	private resolveDamage(
		effect: RuntimeActionEffect,
		result: { cleanSuccesses?: number }
	) {
		const cleanSuccesses = Math.max(0, result.cleanSuccesses ?? 0);
		const value = Math.max(0, effect.value ?? 0);

		switch (effect.damageMode) {
			case 'clean_successes':
				return cleanSuccesses;
			case 'clean_successes_plus_base':
				return cleanSuccesses + value;
			case 'base_damage':
				return value;
			default:
				return value;
		}
	}

	private async resolveEffectTargetParticipantId(
		tx: Prisma.TransactionClient,
		input: {
			actorParticipantId: string;
			selectedTargetParticipantId: string | null;
			effect: RuntimeActionEffect;
		}
	) {
		switch (input.effect.targetScope) {
			case 'actor':
				return input.actorParticipantId;
			case 'linked_condition_target':
				return this.findLinkedTargetParticipantId(tx, {
					actorParticipantId: input.actorParticipantId,
					sourceConditionSlug: input.effect.condition?.slug ?? null
				});
			case 'selected_target':
			default:
				return input.selectedTargetParticipantId;
		}
	}

	private async findLinkedTargetParticipantId(
		tx: Prisma.TransactionClient,
		input: {
			actorParticipantId: string;
			sourceConditionSlug: string | null;
		}
	) {
		const sourceCondition = input.sourceConditionSlug
			? await this.findConditionBySlug(input.sourceConditionSlug)
			: null;
		const link = await tx.combatEncounterConditionLink.findFirst({
			select: { targetParticipantId: true },
			where: {
				sourceParticipantId: input.actorParticipantId,
				sourceConditionId: sourceCondition?.id,
				isActive: true
			},
			orderBy: { createdAt: 'desc' }
		});

		return link?.targetParticipantId ?? null;
	}

	private async resolveConditionInstanceId(
		tx: Prisma.TransactionClient,
		input: {
			participantId: string;
			conditionId: string;
			state: AppliedRuntimeState;
		}
	) {
		const cachedId = input.state.conditionInstances.get(
			this.conditionInstanceKey(input.participantId, input.conditionId)
		);

		if (cachedId) {
			return cachedId;
		}

		const instance = await tx.combatEncounterParticipantCondition.findFirst({
			select: { id: true },
			where: {
				participantId: input.participantId,
				conditionId: input.conditionId,
				isActive: true
			},
			orderBy: { createdAt: 'desc' }
		});

		return instance?.id ?? null;
	}

	private conditionInstanceKey(participantId: string, conditionId: string) {
		return `${participantId}:${conditionId}`;
	}

	private async findConditionBySlug(slug: string) {
		const condition = await this.prisma.condition.findUnique({
			select: {
				id: true,
				slug: true,
				name: true
			},
			where: { slug }
		});

		if (!condition) {
			throw new NotFoundException(`Состояние "${slug}" не найдено.`);
		}

		return condition;
	}

	private findParticipantAction(
		actor: {
			creature: { actions: Prisma.JsonValue } | null;
			creatureTier: {
				actions: Prisma.JsonValue;
				actionOverrides: Prisma.JsonValue;
			} | null;
		},
		actionSlug: string
	) {
		const actions = [
			...this.readRuntimeActions(actor.creature?.actions),
			...this.readRuntimeActions(actor.creatureTier?.actions),
			...this.readRuntimeActions(actor.creatureTier?.actionOverrides)
		];
		const actionBySlug = actions.reduce<Map<string, RuntimeAction>>(
			(result, action) => result.set(action.slug, action),
			new Map<string, RuntimeAction>()
		);

		return actionBySlug.get(actionSlug) ?? null;
	}

	private readRuntimeActions(value: Prisma.JsonValue | undefined) {
		if (!Array.isArray(value)) {
			return [];
		}

		return value
			.map(item => this.readRuntimeAction(item))
			.filter((item): item is RuntimeAction => !!item);
	}

	private readRuntimeAction(value: Prisma.JsonValue): RuntimeAction | null {
		if (!this.isJsonObject(value)) {
			return null;
		}

		const slug = this.readString(value, 'slug');
		const name = this.readString(value, 'name');
		const kind = this.readString(value, 'kind');

		if (!slug || !name || !kind) {
			return null;
		}

		return {
			slug,
			name,
			kind,
			source: this.readActionSource(value['source']),
			cost: this.readActionCost(value['cost']),
			target: this.readActionTarget(value['target']),
			roll: this.readActionRoll(value['roll']),
			defense: this.readActionDefense(value['defense']),
			effects: this.readRuntimeEffects(value['effects']),
			isActive: this.readBoolean(value, 'isActive') ?? true,
			sortOrder: this.readNumber(value, 'sortOrder')
		};
	}

	private readActionRoll(
		value: Prisma.JsonValue | undefined
	): RuntimeActionRoll | null {
		if (!this.isJsonObject(value)) {
			return null;
		}

		const type = this.readString(value, 'type');

		if (type !== 'none' && type !== 'attack_profile' && type !== 'check') {
			return null;
		}

		return {
			type,
			characteristic: this.readReference(value['characteristic']),
			skill: this.readReference(value['skill'])
		};
	}

	private readActionDefense(
		value: Prisma.JsonValue | undefined
	): RuntimeActionDefense | null {
		if (!this.isJsonObject(value)) {
			return null;
		}

		const type = this.readString(value, 'type');

		if (type !== 'none' && type !== 'target_physical_defense') {
			return null;
		}

		const canParry = this.readBoolean(value, 'canParry') ?? false;

		return {
			type,
			canDodge: this.readBoolean(value, 'canDodge') ?? false,
			canParry,
			parrySkillGroups: canParry
				? this.readParrySkillGroups(value['parrySkillGroups'])
				: []
		};
	}

	private readActionCost(value: Prisma.JsonValue | undefined) {
		if (!this.isJsonObject(value)) {
			return undefined;
		}

		return {
			mode: this.readString(value, 'mode') ?? undefined,
			potential: this.readNumber(value, 'potential')
		};
	}

	private readActionSource(
		value: Prisma.JsonValue | undefined
	): RuntimeActionSource | null {
		if (!this.isJsonObject(value)) {
			return null;
		}

		return {
			type: this.readString(value, 'type') ?? 'custom',
			name: this.readString(value, 'name') ?? '',
			slug: this.readString(value, 'slug') ?? '',
			profileName: this.readString(value, 'profileName') ?? '',
			intent: this.readReference(value['intent'])
		};
	}

	private readActionTarget(value: Prisma.JsonValue | undefined) {
		if (!this.isJsonObject(value)) {
			return undefined;
		}

		return {
			type: this.readString(value, 'type') ?? undefined
		};
	}

	private readRuntimeEffects(value: Prisma.JsonValue | undefined) {
		if (!Array.isArray(value)) {
			return [];
		}

		return value
			.map(item => this.readRuntimeEffect(item))
			.filter((item): item is RuntimeActionEffect => !!item);
	}

	private readRuntimeEffect(
		value: Prisma.JsonValue
	): RuntimeActionEffect | null {
		if (!this.isJsonObject(value)) {
			return null;
		}

		const type = this.readString(value, 'type');

		if (!type) {
			return null;
		}

		return {
			type,
			value: this.readNumber(value, 'value'),
			damageMode: this.readDamageMode(value),
			damageType: this.readReference(value['damageType']),
			condition: this.readReference(value['condition']),
			linkedCondition: this.readReference(value['linkedCondition']),
			conditionDisplayName: this.readString(value, 'conditionDisplayName'),
			conditionLevel: this.readNumber(value, 'conditionLevel'),
			targetScope: this.readString(value, 'targetScope'),
			requiresDamageAfterArmor:
				this.readBoolean(value, 'requiresDamageAfterArmor') ?? false,
			text: this.readString(value, 'text'),
			sortOrder: this.readNumber(value, 'sortOrder')
		};
	}

	private readDefenseOptions(value: Prisma.JsonValue): CombatDefenseOption[] {
		if (!Array.isArray(value)) {
			return [];
		}

		return value
			.map(item => {
				if (!this.isJsonObject(item)) {
					return null;
				}

				const mode = this.readString(item, 'mode');

				if (mode !== 'dodge' && mode !== 'parry' && mode !== 'none') {
					return null;
				}

				return {
					mode,
					label: this.readString(item, 'label') ?? 'Защита',
					skillSlug: this.readString(item, 'skillSlug'),
					skillName: this.readString(item, 'skillName')
				};
			})
			.filter((item): item is CombatDefenseOption => !!item);
	}

	private readResolvedRoll(value: Prisma.JsonValue): CombatResolvedRoll | null {
		if (!this.isJsonObject(value)) {
			return null;
		}

		return {
			skillSlug: this.readString(value, 'skillSlug'),
			skillName: this.readString(value, 'skillName') ?? 'Проверка',
			characteristicSlug: this.readString(value, 'characteristicSlug'),
			characteristicName:
				this.readString(value, 'characteristicName') ?? 'Характеристика',
			diceCount: this.readNumber(value, 'diceCount') ?? 0,
			dice: this.readNumberArray(value['dice']),
			successes: this.readNumber(value, 'successes') ?? 0,
			sixes: this.readNumber(value, 'sixes') ?? 0,
			ones: this.readNumber(value, 'ones') ?? 0,
			ignoredOnes: this.readNumber(value, 'ignoredOnes') ?? 0,
			consequenceCount: this.readNumber(value, 'consequenceCount') ?? 0,
			skillLevel: this.readNumber(value, 'skillLevel') ?? 0
		};
	}

	private readDeclaredActionId(value: Prisma.JsonValue) {
		if (!this.isJsonObject(value)) {
			return null;
		}

		return this.readString(value, 'declaredActionId');
	}

	private readDamageMode(value: Record<string, Prisma.JsonValue>) {
		const mode = this.readString(value, 'damageMode');

		return mode === 'clean_successes' ||
			mode === 'clean_successes_plus_base' ||
			mode === 'base_damage'
			? mode
			: null;
	}

	private readReference(
		value: Prisma.JsonValue | undefined
	): RuntimeActionReference | null {
		if (!this.isJsonObject(value)) {
			return null;
		}

		const name = this.readString(value, 'name');
		const slug = this.readString(value, 'slug');

		return name && slug ? { name, slug } : null;
	}

	private actionRequiresSelectedTarget(action: RuntimeAction) {
		return (
			action.target?.type === 'creature' ||
			action.target?.type === 'hostile_creature'
		);
	}

	private isJsonObject(
		value: Prisma.JsonValue | undefined
	): value is Record<string, Prisma.JsonValue> {
		return !!value && typeof value === 'object' && !Array.isArray(value);
	}

	private readString(
		value: Record<string, Prisma.JsonValue>,
		key: string
	): string | null {
		const rawValue = value[key];
		return typeof rawValue === 'string' ? rawValue : null;
	}

	private readNumber(
		value: Record<string, Prisma.JsonValue>,
		key: string
	): number | null {
		const rawValue = value[key];
		return typeof rawValue === 'number' && Number.isFinite(rawValue)
			? rawValue
			: null;
	}

	private readNumberArray(value: Prisma.JsonValue | undefined): number[] {
		return Array.isArray(value)
			? value.filter(
					(item): item is number =>
						typeof item === 'number' && Number.isFinite(item)
				)
			: [];
	}

	private readBoolean(
		value: Record<string, Prisma.JsonValue>,
		key: string
	): boolean | null {
		const rawValue = value[key];
		return typeof rawValue === 'boolean' ? rawValue : null;
	}

	private readParrySkillGroups(
		value: Prisma.JsonValue | undefined
	): RuntimeActionDefense['parrySkillGroups'] {
		if (!Array.isArray(value)) {
			return [];
		}

		return value.filter(
			(item): item is RuntimeActionDefense['parrySkillGroups'][number] =>
				item === 'unarmed' || item === 'melee_weapon' || item === 'shield'
		);
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

	private mapEncounter(
		encounter: CombatEncounterRecord,
		currentUserRole: CampaignMemberRole
	) {
		return {
			id: encounter.id,
			campaignId: encounter.campaignId,
			name: encounter.name,
			status: encounter.status,
			currentUserRole,
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
				creature: participant.creature
					? {
							id: participant.creature.id,
							name: participant.creature.name,
							actions: this.readRuntimeActions(participant.creature.actions),
							naturalAttacks: participant.creature.naturalAttackLinks.map(
								link => ({
									id: link.id,
									naturalAttackId: link.naturalAttackId,
									naturalAttack: link.naturalAttack,
									attackProfiles: link.attackProfiles,
									isActive: link.isActive,
									sortOrder: link.sortOrder
								})
							)
						}
					: null,
				creatureTierId: participant.creatureTierId,
				creatureTier: participant.creatureTier
					? {
							...participant.creatureTier,
							actions: this.readRuntimeActions(
								participant.creatureTier.actions
							),
							actionOverrides: this.readRuntimeActions(
								participant.creatureTier.actionOverrides
							)
						}
					: null,
				sceneName: participant.sceneName,
				currentHealth: participant.currentHealth,
				currentPotential: participant.currentPotential,
				initiative: participant.initiative,
				isActive: participant.isActive,
				sortOrder: participant.sortOrder,
				conditions: participant.conditions.map(condition => ({
					id: condition.id,
					conditionId: condition.conditionId,
					condition: condition.condition,
					displayName: condition.displayName,
					level: condition.level,
					sourceParticipantId: condition.sourceParticipantId,
					sourceActionSlug: condition.sourceActionSlug,
					metadata: condition.metadata,
					isActive: condition.isActive,
					createdAt: condition.createdAt.toISOString(),
					updatedAt: condition.updatedAt.toISOString()
				})),
				createdAt: participant.createdAt.toISOString(),
				updatedAt: participant.updatedAt.toISOString()
			})),
			conditionLinks: encounter.conditionLinks.map(link => ({
				id: link.id,
				sourceParticipantId: link.sourceParticipantId,
				targetParticipantId: link.targetParticipantId,
				sourceConditionId: link.sourceConditionId,
				sourceCondition: link.sourceCondition,
				targetConditionId: link.targetConditionId,
				targetCondition: link.targetCondition,
				sourceConditionInstanceId: link.sourceConditionInstanceId,
				targetConditionInstanceId: link.targetConditionInstanceId,
				sourceActionSlug: link.sourceActionSlug,
				metadata: link.metadata,
				isActive: link.isActive,
				createdAt: link.createdAt.toISOString(),
				updatedAt: link.updatedAt.toISOString()
			})),
			defenseRequests: encounter.defenseRequests.map(request => ({
				id: request.id,
				actorParticipantId: request.actorParticipantId,
				targetParticipantId: request.targetParticipantId,
				createdByUserId: request.createdByUserId,
				actionSlug: request.actionSlug,
				actionSnapshot: request.actionSnapshot,
				attackRoll: request.attackRoll,
				defenseOptions: request.defenseOptions,
				status: request.status,
				resolvedByUserId: request.resolvedByUserId,
				resolvedAt: request.resolvedAt?.toISOString() ?? null,
				resolution: request.resolution,
				createdAt: request.createdAt.toISOString(),
				updatedAt: request.updatedAt.toISOString()
			})),
			declaredActions: encounter.declaredActions.map(action => ({
				id: action.id,
				actorParticipantId: action.actorParticipantId,
				targetParticipantId: action.targetParticipantId,
				createdByUserId: action.createdByUserId,
				actionSlug: action.actionSlug,
				actionSnapshot: action.actionSnapshot,
				declaredAtPotential: action.declaredAtPotential,
				resolveAtPotential: action.resolveAtPotential,
				status: action.status,
				resolvedByUserId: action.resolvedByUserId,
				resolvedAt: action.resolvedAt?.toISOString() ?? null,
				resolution: action.resolution,
				createdAt: action.createdAt.toISOString(),
				updatedAt: action.updatedAt.toISOString()
			})),
			events: encounter.events
				.map(event => ({
					id: event.id,
					createdByUserId: event.createdByUserId,
					actorParticipantId: event.actorParticipantId,
					targetParticipantId: event.targetParticipantId,
					type: event.type,
					actionSlug: event.actionSlug,
					payload: event.payload,
					createdAt: event.createdAt.toISOString()
				}))
				.reverse(),
			createdAt: encounter.createdAt.toISOString(),
			updatedAt: encounter.updatedAt.toISOString()
		};
	}

	private mapEncounterSummary(encounter: CombatEncounterSummaryRecord) {
		return {
			id: encounter.id,
			campaignId: encounter.campaignId,
			name: encounter.name,
			status: encounter.status,
			isActive: encounter.isActive,
			participantsCount: encounter._count.participants,
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
