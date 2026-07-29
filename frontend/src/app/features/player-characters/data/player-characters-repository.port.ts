import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
	CharacterSheetSandboxDraft,
	CharacterSheetSandboxRollResult
} from '../../character-sheet/domain/character-sheet-sandbox.models';
import {
	PlayerCharacter,
	PlayerCharacterSummary
} from '../domain/player-characters.models';

export interface PlayerCharactersRepository {
	loadCampaignCharacters(
		campaignId: string
	): Observable<PlayerCharacterSummary[]>;
	createCharacter(
		campaignId: string,
		command: {
			name: string;
		}
	): Observable<PlayerCharacter>;
	loadCharacter(id: string): Observable<PlayerCharacter>;
	updateCharacter(
		id: string,
		command: {
			name?: string;
		}
	): Observable<PlayerCharacter>;
	loadSheet(id: string): Observable<CharacterSheetSandboxDraft>;
	updateSheet(
		id: string,
		inputValues: Record<string, number>
	): Observable<CharacterSheetSandboxDraft>;
	rollSkill(
		id: string,
		skillId: string,
		inputValues: Record<string, number>
	): Observable<CharacterSheetSandboxRollResult>;
}

export const PLAYER_CHARACTERS_REPOSITORY =
	new InjectionToken<PlayerCharactersRepository>(
		'PLAYER_CHARACTERS_REPOSITORY'
	);
