import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
	MagicSpellFormulasCatalog,
	MagicWord,
	MagicWordType,
	MagicWordsCatalog
} from '../domain/magic-word.models';
import {
	PersistedSpellStatus,
	Spell,
	SpellCatalog
} from '../domain/spell.models';

export interface MagicWordsRepository {
	loadCatalog(): Observable<MagicWordsCatalog>;
	loadSpellFormulas(): Observable<MagicSpellFormulasCatalog>;
	createWord(command: {
		type: MagicWordType;
		name: string;
		description?: string;
		isActive?: boolean;
		sortOrder?: number;
		allowedGestureIds?: string[];
		skillIds?: string[];
		damageTypeIds?: string[];
		conditionIds?: string[];
	}): Observable<MagicWord>;
	updateWord(
		id: string,
		command: {
			type?: MagicWordType;
			name?: string;
			description?: string;
			isActive?: boolean;
			sortOrder?: number;
			allowedGestureIds?: string[];
			skillIds?: string[];
			damageTypeIds?: string[];
			conditionIds?: string[];
		}
	): Observable<MagicWord>;
	deleteWord(id: string): Observable<void>;
	loadSpellCatalog(): Observable<SpellCatalog>;
	createSpell(command: {
		actionId: string;
		essenceId: string;
		gestureId: string;
		name: string;
		description?: string;
		status: PersistedSpellStatus;
		isActive?: boolean;
		sortOrder?: number;
	}): Observable<Spell>;
	updateSpell(
		id: string,
		command: {
			name: string;
			description?: string;
			status: PersistedSpellStatus;
			isActive?: boolean;
			sortOrder?: number;
		}
	): Observable<Spell>;
	deleteSpell(id: string): Observable<void>;
}

export const MAGIC_WORDS_REPOSITORY =
	new InjectionToken<MagicWordsRepository>('MAGIC_WORDS_REPOSITORY');
