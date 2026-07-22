import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { CombatEncounter } from '../domain/combat-encounters.models';

export interface CombatEncountersRepository {
	loadCampaignEncounters(campaignId: string): Observable<CombatEncounter[]>;
	createEncounter(
		campaignId: string,
		command: { name?: string }
	): Observable<CombatEncounter>;
	loadEncounter(id: string): Observable<CombatEncounter>;
	addPlayerCharacter(
		id: string,
		command: { playerCharacterId: string }
	): Observable<CombatEncounter>;
	addCreature(
		id: string,
		command: {
			creatureId: string;
			creatureTierId?: string;
			sceneName?: string;
			count?: number;
		}
	): Observable<CombatEncounter>;
	updateParticipant(
		id: string,
		participantId: string,
		command: {
			sceneName?: string;
			currentHealth?: number;
			currentPotential?: number;
			initiative?: number | null;
			isActive?: boolean;
		}
	): Observable<CombatEncounter>;
}

export const COMBAT_ENCOUNTERS_REPOSITORY =
	new InjectionToken<CombatEncountersRepository>(
		'COMBAT_ENCOUNTERS_REPOSITORY'
	);
