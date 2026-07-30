import { Injectable } from '@nestjs/common';
import { CampaignMemberRole } from './domain/combat-encounter.types';
import { CombatEncounterRuntimeService } from './domain/combat-encounter-runtime.service';
import type {
	CombatEncounterReadModel,
	CombatEncounterSummaryReadModel
} from './application/combat-encounter.read-model';

@Injectable()
export class CombatEncounterViewService {
	constructor(private readonly runtime: CombatEncounterRuntimeService) {}

	mapEncounter(
		encounter: CombatEncounterReadModel,
		currentUserRole: CampaignMemberRole
	) {
		return {
			id: encounter.id,
			campaignId: encounter.campaignId,
			name: encounter.name,
			status: encounter.status,
			stateVersion: encounter.stateVersion,
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
							actions: this.runtime.readRuntimeActions(
								participant.creature.actions
							),
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
							actions: this.runtime.readRuntimeActions(
								participant.creatureTier.actions
							),
							actionOverrides: this.runtime.readRuntimeActions(
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

	mapEncounterSummary(encounter: CombatEncounterSummaryReadModel) {
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
