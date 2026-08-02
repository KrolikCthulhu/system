import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/generated';
import { PrismaService } from '../../prisma/prisma.service';
import { ExecuteCombatActionActor } from '../application/execute-combat-action.port';
import { PendingCombatDefenseRequest } from '../application/resolve-combat-defense.port';
import { PendingDeclaredCombatAction } from '../application/resolve-declared-combat-action.port';
import {
	CombatDefenseOption,
	CombatResolvedRoll
} from '../domain/combat-action-check.types';
import { CombatEncounterEffectRuntimeService } from '../combat-encounter-effect-runtime.service';
import {
	createActionDeclaredEvent,
	createActionExecutedEvent,
	createActionResolvedEvent,
	createDefenseRequestedEvent,
	createDefenseStanceEnteredEvent,
	createInitiativeWaitedEvent,
	createRoundParticipationEndedEvent
} from '../domain/combat-encounter-events';
import { CombatEncounterRuntimeService } from '../domain/combat-encounter-runtime.service';
import {
	AppliedRuntimeState,
	RuntimeAction
} from '../domain/combat-encounter-runtime.types';

@Injectable()
export class CombatEventRepository {
	constructor(
		private readonly prisma: PrismaService,
		private readonly effects: CombatEncounterEffectRuntimeService,
		private readonly runtime: CombatEncounterRuntimeService
	) {}

	async recordDefenseStanceEntered(input: {
		encounterId: string;
		participantId: string;
		userId: string;
		participantName: string;
		round: number;
		preservedPotential: number;
	}) {
		await this.prisma.$transaction(async tx => {
			await tx.combatEncounterParticipant.update({
				where: { id: input.participantId },
				data: {
					defenseStanceRound: input.round
				}
			});
			await tx.combatEncounterEvent.create({
				data: {
					encounterId: input.encounterId,
					createdByUserId: input.userId,
					actorParticipantId: input.participantId,
					targetParticipantId: null,
					...createDefenseStanceEnteredEvent({
						participantName: input.participantName,
						round: input.round,
						preservedPotential: input.preservedPotential
					})
				}
			});
		});
	}

	async recordRoundParticipationEnded(input: {
		encounterId: string;
		participantId: string;
		userId: string;
		participantName: string;
		round: number;
		preservedPotential: number;
	}) {
		await this.prisma.$transaction(async tx => {
			await tx.combatEncounterParticipant.update({
				where: { id: input.participantId },
				data: {
					roundParticipationEndedRound: input.round
				}
			});
			await tx.combatEncounterEvent.create({
				data: {
					encounterId: input.encounterId,
					createdByUserId: input.userId,
					actorParticipantId: input.participantId,
					targetParticipantId: null,
					...createRoundParticipationEndedEvent({
						participantName: input.participantName,
						round: input.round,
						preservedPotential: input.preservedPotential
					})
				}
			});
		});
	}

	async recordInitiativeWaited(input: {
		encounterId: string;
		participantId: string;
		targetParticipantId: string;
		userId: string;
		participantName: string;
		targetParticipantName: string;
		fromPotential: number;
		toPotential: number;
		potentialCost: number;
	}) {
		await this.prisma.$transaction(async tx => {
			await tx.combatEncounterParticipant.update({
				where: { id: input.participantId },
				data: {
					currentPotential: input.toPotential
				}
			});
			await tx.combatEncounterEvent.create({
				data: {
					encounterId: input.encounterId,
					createdByUserId: input.userId,
					actorParticipantId: input.participantId,
					targetParticipantId: input.targetParticipantId,
					...createInitiativeWaitedEvent({
						participantName: input.participantName,
						targetParticipantName: input.targetParticipantName,
						fromPotential: input.fromPotential,
						toPotential: input.toPotential,
						potentialCost: input.potentialCost
					})
				}
			});
		});
	}

	async recordDeclaredAction(input: {
		encounterId: string;
		userId: string;
		actor: ExecuteCombatActionActor;
		targetParticipantId: string | null;
		action: RuntimeAction;
	}) {
		await this.prisma.$transaction(async tx => {
			await this.effects.spendActionPotential(tx, input.actor, input.action);
			const resolveAtPotential = this.runtime.resolveActionPotentialAfterCost(
				input.actor,
				input.action
			);

			await tx.combatEncounterDeclaredAction.create({
				data: {
					encounterId: input.encounterId,
					actorParticipantId: input.actor.id,
					targetParticipantId: input.targetParticipantId,
					createdByUserId: input.userId,
					actionSlug: input.action.slug,
					actionSnapshot: input.action as unknown as Prisma.InputJsonValue,
					declaredAtPotential: input.actor.currentPotential,
					resolveAtPotential
				}
			});
			await tx.combatEncounterEvent.create({
				data: {
					encounterId: input.encounterId,
					createdByUserId: input.userId,
					actorParticipantId: input.actor.id,
					targetParticipantId: input.targetParticipantId,
					...createActionDeclaredEvent({
						actionSlug: input.action.slug,
						actionName: input.action.name,
						declaredAtPotential: input.actor.currentPotential,
						resolveAtPotential
					})
				}
			});
		});
	}

	async requestPlayerDefense(input: {
		encounterId: string;
		userId: string;
		actor: { id: string; currentPotential: number };
		targetParticipantId: string;
		action: RuntimeAction;
		attackRoll: CombatResolvedRoll;
		defenseOptions: CombatDefenseOption[];
		declaredActionId?: string;
	}) {
		await this.prisma.$transaction(async tx => {
			if (!input.declaredActionId) {
				await this.effects.spendActionPotential(tx, input.actor, input.action);
			}
			await tx.combatEncounterDefenseRequest.create({
				data: {
					encounterId: input.encounterId,
					actorParticipantId: input.actor.id,
					targetParticipantId: input.targetParticipantId,
					createdByUserId: input.userId,
					actionSlug: input.action.slug,
					actionSnapshot: input.action as unknown as Prisma.InputJsonValue,
					attackRoll: input.attackRoll as unknown as Prisma.InputJsonValue,
					defenseOptions:
						input.defenseOptions as unknown as Prisma.InputJsonValue,
					resolution: input.declaredActionId
						? ({
								declaredActionId: input.declaredActionId
							} as unknown as Prisma.InputJsonValue)
						: undefined
				}
			});
			if (input.declaredActionId) {
				await tx.combatEncounterDeclaredAction.update({
					where: { id: input.declaredActionId },
					data: { status: 'waiting_defense' }
				});
			}
			await tx.combatEncounterEvent.create({
				data: {
					encounterId: input.encounterId,
					createdByUserId: input.userId,
					actorParticipantId: input.actor.id,
					targetParticipantId: input.targetParticipantId,
					...createDefenseRequestedEvent({
						actionSlug: input.action.slug,
						actionName: input.action.name,
						attackRoll: input.attackRoll,
						defenseOptions: input.defenseOptions
					})
				}
			});
		});
	}

	async recordActionExecuted(input: {
		encounterId: string;
		userId: string;
		actor: { id: string; currentPotential: number };
		targetParticipantId: string | null;
		action: RuntimeAction;
		attackRoll: CombatResolvedRoll | null;
		defenseRoll: CombatResolvedRoll | null;
		defense: CombatDefenseOption | null;
		result: ReturnType<
			CombatEncounterRuntimeService['resolveCombatActionResult']
		>;
		declaredActionId?: string;
	}) {
		const state: AppliedRuntimeState = {
			lastDamageAfterArmor: 0,
			conditionInstances: new Map<string, string>(),
			linkedTargetParticipantId: null,
			events: []
		};

		await this.prisma.$transaction(async tx => {
			if (!input.declaredActionId) {
				await this.effects.spendActionPotential(tx, input.actor, input.action);
			}

			for (const effect of [...(input.action.effects ?? [])].sort(
				(first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0)
			)) {
				if (input.attackRoll && input.result.cleanSuccesses <= 0) {
					continue;
				}

				if (
					effect.requiresDamageAfterArmor &&
					state.lastDamageAfterArmor <= 0
				) {
					continue;
				}

				await this.effects.applyActionEffect(tx, {
					encounterId: input.encounterId,
					actorParticipantId: input.actor.id,
					selectedTargetParticipantId: input.targetParticipantId,
					action: input.action,
					effect,
					result: input.result,
					state
				});
			}

			await tx.combatEncounterEvent.create({
				data: {
					encounterId: input.encounterId,
					createdByUserId: input.userId,
					actorParticipantId: input.actor.id,
					targetParticipantId: input.targetParticipantId,
					...createActionExecutedEvent({
						actionSlug: input.action.slug,
						actionName: input.action.name,
						result: input.result,
						attackRoll: input.attackRoll,
						defenseRoll: input.defenseRoll,
						defense: input.defense,
						effects: state.events
					})
				}
			});
			if (input.declaredActionId) {
				await tx.combatEncounterDeclaredAction.update({
					where: { id: input.declaredActionId },
					data: {
						status: 'resolved',
						resolvedByUserId: input.userId,
						resolvedAt: new Date(),
						resolution: {
							result: input.result,
							attackRoll: input.attackRoll,
							defenseRoll: input.defenseRoll,
							defense: input.defense,
							effects: state.events
						} as unknown as Prisma.InputJsonValue
					}
				});
			}
		});
	}

	findPendingDefenseRequest(input: {
		encounterId: string;
		defenseRequestId: string;
	}): Promise<PendingCombatDefenseRequest | null> {
		return this.prisma.combatEncounterDefenseRequest.findFirst({
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
						roundParticipationEndedRound: true,
						playerCharacter: {
							select: {
								ownerUserId: true
							}
						}
					}
				}
			},
			where: {
				id: input.defenseRequestId,
				encounterId: input.encounterId,
				status: 'pending'
			}
		});
	}

	async resolvePendingDefense(input: {
		encounterId: string;
		userId: string;
		request: PendingCombatDefenseRequest;
		action: RuntimeAction;
		defense: CombatDefenseOption;
		attackRoll: CombatResolvedRoll | null;
		defenseRoll: CombatResolvedRoll;
		result: ReturnType<
			CombatEncounterRuntimeService['resolveCombatActionResult']
		>;
		declaredActionId: string | null;
	}) {
		const state: AppliedRuntimeState = {
			lastDamageAfterArmor: 0,
			conditionInstances: new Map<string, string>(),
			linkedTargetParticipantId: null,
			events: []
		};

		await this.prisma.$transaction(async tx => {
			for (const effect of [...(input.action.effects ?? [])].sort(
				(first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0)
			)) {
				if (input.attackRoll && input.result.cleanSuccesses <= 0) {
					continue;
				}

				if (
					effect.requiresDamageAfterArmor &&
					state.lastDamageAfterArmor <= 0
				) {
					continue;
				}

				await this.effects.applyActionEffect(tx, {
					encounterId: input.encounterId,
					actorParticipantId: input.request.actorParticipantId,
					selectedTargetParticipantId: input.request.targetParticipantId,
					action: input.action,
					effect,
					result: input.result,
					state
				});
			}

			await tx.combatEncounterDefenseRequest.update({
				where: { id: input.request.id },
				data: {
					status: 'resolved',
					resolvedByUserId: input.userId,
					resolvedAt: new Date(),
					resolution: {
						defense: input.defense,
						defenseRoll: input.defenseRoll,
						result: input.result,
						effects: state.events
					} as unknown as Prisma.InputJsonValue
				}
			});
			await tx.combatEncounterEvent.create({
				data: {
					encounterId: input.encounterId,
					createdByUserId: input.userId,
					actorParticipantId: input.request.actorParticipantId,
					targetParticipantId: input.request.targetParticipantId,
					...createActionResolvedEvent({
						actionSlug: input.action.slug,
						actionName: input.action.name,
						attackRoll: input.attackRoll,
						defense: input.defense,
						defenseRoll: input.defenseRoll,
						result: input.result,
						effects: state.events
					})
				}
			});
			if (input.declaredActionId) {
				await tx.combatEncounterDeclaredAction.update({
					where: { id: input.declaredActionId },
					data: {
						status: 'resolved',
						resolvedByUserId: input.userId,
						resolvedAt: new Date(),
						resolution: {
							defense: input.defense,
							defenseRoll: input.defenseRoll,
							result: input.result,
							effects: state.events
						} as unknown as Prisma.InputJsonValue
					}
				});
			}
		});
	}

	findPendingDeclaredAction(input: {
		encounterId: string;
		declaredActionId: string;
	}): Promise<PendingDeclaredCombatAction | null> {
		return this.prisma.combatEncounterDeclaredAction.findFirst({
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
				id: input.declaredActionId,
				encounterId: input.encounterId,
				status: 'pending'
			}
		});
	}

	async markDeclaredActionResolving(declaredActionId: string) {
		await this.prisma.combatEncounterDeclaredAction.update({
			where: { id: declaredActionId },
			data: { status: 'resolving' }
		});
	}

	async markDeclaredActionPending(declaredActionId: string) {
		await this.prisma.combatEncounterDeclaredAction.update({
			where: { id: declaredActionId },
			data: { status: 'pending' }
		});
	}
}
