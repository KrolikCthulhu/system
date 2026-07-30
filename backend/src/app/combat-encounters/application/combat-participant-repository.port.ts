import { UpdateCombatParticipantDto } from '../dto/update-combat-participant.dto';

export const COMBAT_PARTICIPANT_REPOSITORY = Symbol(
	'COMBAT_PARTICIPANT_REPOSITORY'
);

export interface CombatParticipantRepositoryPort {
	addPlayerCharacter(input: {
		encounterId: string;
		campaignId: string;
		playerCharacterId: string;
	}): Promise<void>;
	addCreatures(input: {
		encounterId: string;
		creatureId: string;
		creatureTierId?: string | null;
		count: number;
		sceneName?: string;
	}): Promise<void>;
	update(input: {
		encounterId: string;
		participantId: string;
		dto: UpdateCombatParticipantDto;
	}): Promise<void>;
	findForSizeRule(
		encounterId: string,
		participantId: string
	): Promise<{
		creatureTier: {
			size: { id: string; name: string; rank: number } | null;
		} | null;
	} | null>;
	findDefaultSizeForSizeRule(): Promise<{
		id: string;
		name: string;
		rank: number;
	} | null>;
}
