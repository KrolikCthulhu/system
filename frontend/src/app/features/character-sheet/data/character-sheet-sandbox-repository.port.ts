import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
	CharacterSheetSandboxDraft,
	CharacterSheetSandboxRollResult
} from '../domain/character-sheet-sandbox.models';

export interface CharacterSheetSandboxRepository {
	loadDraft(): Observable<CharacterSheetSandboxDraft>;
	updateDraft(
		inputValues: Record<string, number>
	): Observable<CharacterSheetSandboxDraft>;
	rollSkill(
		skillId: string,
		inputValues: Record<string, number>
	): Observable<CharacterSheetSandboxRollResult>;
}

export const CHARACTER_SHEET_SANDBOX_REPOSITORY =
	new InjectionToken<CharacterSheetSandboxRepository>(
		'CHARACTER_SHEET_SANDBOX_REPOSITORY'
	);
