import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
	MagicSpellFormulasCatalog,
	MagicWord,
	MagicWordAreaShape,
	MagicWordEssenceProfile,
	MagicWordType,
	MagicWordsCatalog
} from '../domain/magic-word.models';
import {
	PersistedSpellStatus,
	Spell,
	SpellCatalog,
	SpellConfig,
	SpellMechanicBlock,
	SpellRuntimePreview,
	SpellRuntimePreviewRequest,
	SpellTextBlock,
	SpellTargetConfig
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
		essenceProfile?: MagicWordEssenceProfile;
		areaShape?: MagicWordAreaShape;
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
			essenceProfile?: MagicWordEssenceProfile;
			areaShape?: MagicWordAreaShape;
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
		config?: SpellConfig;
		status: PersistedSpellStatus;
		isActive?: boolean;
		sortOrder?: number;
		targetConfigs?: SpellTargetConfig[];
		textBlocks?: SpellTextBlock[];
		mechanicBlocks?: Array<
			Omit<SpellMechanicBlock, 'createdAt' | 'updatedAt'>
		>;
	}): Observable<Spell>;
	updateSpell(
		id: string,
		command: {
			name: string;
			description?: string;
			config?: SpellConfig;
			status: PersistedSpellStatus;
			isActive?: boolean;
			sortOrder?: number;
			targetConfigs?: SpellTargetConfig[];
			textBlocks?: SpellTextBlock[];
			mechanicBlocks?: Array<
				Omit<SpellMechanicBlock, 'createdAt' | 'updatedAt'>
			>;
		}
	): Observable<Spell>;
	deleteSpell(id: string): Observable<void>;
	executeSpellRuntimePreview(
		id: string,
		command: SpellRuntimePreviewRequest
	): Observable<SpellRuntimePreview>;
}

export const MAGIC_WORDS_REPOSITORY =
	new InjectionToken<MagicWordsRepository>('MAGIC_WORDS_REPOSITORY');
