import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
	CreatureType,
	CreatureTypesCatalog
} from '../domain/creature-types.models';
import {
	CreateCreatureTypeDto,
	UpdateCreatureTypeDto
} from './dto/creature-types.dto';

export interface CreatureTypesRepository {
	loadCatalog(): Observable<CreatureTypesCatalog>;
	createCreatureType(command: CreateCreatureTypeDto): Observable<CreatureType>;
	updateCreatureType(
		id: string,
		command: UpdateCreatureTypeDto
	): Observable<CreatureType>;
	deleteCreatureType(id: string): Observable<void>;
}

export const CREATURE_TYPES_REPOSITORY =
	new InjectionToken<CreatureTypesRepository>('CREATURE_TYPES_REPOSITORY');
