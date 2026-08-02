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
			currentSpeed?: number;
			isActive?: boolean;
		}
	): Observable<CombatEncounter>;
	resolveKnockdownSizeRule(
		id: string,
		attackerParticipantId: string,
		targetParticipantId: string
	): Observable<KnockdownSizeRuleResult>;
	executeAction(
		id: string,
		command: {
			expectedVersion: number;
			actorParticipantId: string;
			actionSlug: string;
			targetParticipantId?: string | null;
		}
	): Observable<CombatEncounter>;
	waitUntilAfterParticipant(
		id: string,
		command: {
			expectedVersion: number;
			actorParticipantId: string;
			targetParticipantId: string;
			actionSlug: string;
		}
	): Observable<CombatEncounter>;
	enterDefenseStance(
		id: string,
		command: {
			expectedVersion: number;
			actorParticipantId: string;
			actionSlug: string;
		}
	): Observable<CombatEncounter>;
	endRoundParticipation(
		id: string,
		command: {
			expectedVersion: number;
			actorParticipantId: string;
			actionSlug: string;
		}
	): Observable<CombatEncounter>;
	resolveDefense(
		id: string,
		command: {
			expectedVersion: number;
			defenseRequestId: string;
			mode: CombatDefenseMode;
			skillSlug?: string | null;
		}
	): Observable<CombatEncounter>;
	resolveDeclaredAction(
		id: string,
		command: {
			expectedVersion: number;
			declaredActionId: string;
		}
	): Observable<CombatEncounter>;
}

export const COMBAT_ENCOUNTERS_REPOSITORY =
	new InjectionToken<CombatEncountersRepository>(
		'COMBAT_ENCOUNTERS_REPOSITORY'
	);
