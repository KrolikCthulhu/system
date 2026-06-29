import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
	ArmorPreset,
	ArmorPresetsCatalog
} from '../domain/armor-presets.models';

export interface ArmorPresetsRepository {
	loadCatalog(): Observable<ArmorPresetsCatalog>;
	createArmorPreset(command: {
		name: string;
		points: number;
		protection: number;
		isActive?: boolean;
		sortOrder?: number;
	}): Observable<ArmorPreset>;
	updateArmorPreset(
		id: string,
		command: {
			name?: string;
			points?: number;
			protection?: number;
			isActive?: boolean;
			sortOrder?: number;
		}
	): Observable<ArmorPreset>;
	deleteArmorPreset(id: string): Observable<void>;
}

export const ARMOR_PRESETS_REPOSITORY =
	new InjectionToken<ArmorPresetsRepository>('ARMOR_PRESETS_REPOSITORY');
