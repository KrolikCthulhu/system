import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
	ProgressionPreset,
	ProgressionPresetConfig,
	ProgressionPresetKind,
	ProgressionPresetsCatalog
} from '../domain/progression-presets.models';

export interface ProgressionPresetsRepository {
	loadCatalog(): Observable<ProgressionPresetsCatalog>;
	createPreset(command: {
		name: string;
		description?: string;
		kind: ProgressionPresetKind;
		config: ProgressionPresetConfig;
		isActive?: boolean;
		sortOrder?: number;
	}): Observable<ProgressionPreset>;
	updatePreset(
		id: string,
		command: {
			name?: string;
			description?: string;
			kind?: ProgressionPresetKind;
			config?: ProgressionPresetConfig;
			isActive?: boolean;
			sortOrder?: number;
		}
	): Observable<ProgressionPreset>;
	deletePreset(id: string): Observable<void>;
}

export const PROGRESSION_PRESETS_REPOSITORY =
	new InjectionToken<ProgressionPresetsRepository>(
		'PROGRESSION_PRESETS_REPOSITORY'
	);
