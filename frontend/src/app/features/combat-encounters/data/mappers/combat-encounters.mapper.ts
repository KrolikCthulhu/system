import {
	CombatEncounter,
	CombatEncounterSummary
} from '../../domain/combat-encounters.models';
import {
	CombatEncounterDto,
	CombatEncountersResponseDto,
	CombatEncounterSummaryDto
} from '../dto/combat-encounters.dto';

export function mapCombatEncountersResponseDto(
	dto: CombatEncountersResponseDto
): CombatEncounterSummary[] {
	return dto.encounters.map(mapCombatEncounterSummaryDto);
}

export function mapCombatEncounterSummaryDto(
	dto: CombatEncounterSummaryDto
): CombatEncounterSummary {
	return {
		id: dto.id,
		campaignId: dto.campaignId,
		name: dto.name,
		status: dto.status,
		isActive: dto.isActive,
		participantsCount: dto.participantsCount,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}

export function mapCombatEncounterDto(
	dto: CombatEncounterDto
): CombatEncounter {
	return {
		id: dto.id,
		campaignId: dto.campaignId,
		name: dto.name,
		status: dto.status,
		currentRound: dto.currentRound,
		stateVersion: dto.stateVersion,
		currentUserRole: dto.currentUserRole,
		isActive: dto.isActive,
		participants: dto.participants.map(participant => ({
			id: participant.id,
			kind: participant.kind,
			playerCharacterId: participant.playerCharacterId,
			playerCharacter: participant.playerCharacter,
			creatureId: participant.creatureId,
			creature: participant.creature,
			creatureTierId: participant.creatureTierId,
			creatureTier: participant.creatureTier,
			sceneName: participant.sceneName,
			currentHealth: participant.currentHealth,
			currentPotential: participant.currentPotential,
			maximumPotential: participant.maximumPotential,
			currentSpeed: participant.currentSpeed,
			defenseStanceRound: participant.defenseStanceRound,
			roundParticipationEndedRound:
				participant.roundParticipationEndedRound,
			isInDefenseStance: participant.isInDefenseStance,
			hasEndedRoundParticipation: participant.hasEndedRoundParticipation,
			isActive: participant.isActive,
			sortOrder: participant.sortOrder,
			availableActions: participant.availableActions,
			conditions: participant.conditions,
			createdAt: participant.createdAt,
			updatedAt: participant.updatedAt
		})),
		conditionLinks: dto.conditionLinks,
		defenseRequests: dto.defenseRequests,
		declaredActions: dto.declaredActions ?? [],
		events: dto.events,
		createdAt: dto.createdAt,
		updatedAt: dto.updatedAt
	};
}
