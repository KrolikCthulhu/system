import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
	CombatEncounter,
	CombatDefenseMode,
	CombatEncounterSummary,
	CombatEncounterStatus,
	KnockdownSizeRuleResult
} from '../domain/combat-encounters.models';

export interface CombatEncountersRepository {
	loadCampaignEncounters(
		campaignId: string
	): Observable<CombatEncounterSummary[]>;
	createEncounter(
		campaignId: string,
		command: { name?: string }
	): Observable<CombatEncounter>;
	loadEncounter(id: string): Observable<CombatEncounter>;
	updateEncounter(
		id: string,
		command: { status?: CombatEncounterStatus }
	): Observable<CombatEncounter>;
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
	skipParticipantTurn(
		id: string,
		participantId: string
	): Observable<CombatEncounter>;
	resolveKnockdownSizeRule(
		id: string,
		attackerParticipantId: string,
		targetParticipantId: string
	): Observable<KnockdownSizeRuleResult>;
	executeAction(
		id: string,
		command: {
			actorParticipantId: string;
			actionSlug: string;
			targetParticipantId?: string | null;
		}
	): Observable<CombatEncounter>;
	resolveDefense(
		id: string,
		command: {
			defenseRequestId: string;
			mode: CombatDefenseMode;
			skillSlug?: string | null;
		}
	): Observable<CombatEncounter>;
	resolveDeclaredAction(
		id: string,
		command: {
			declaredActionId: string;
		}
	): Observable<CombatEncounter>;
}

export const COMBAT_ENCOUNTERS_REPOSITORY =
	new InjectionToken<CombatEncountersRepository>(
		'COMBAT_ENCOUNTERS_REPOSITORY'
	);
