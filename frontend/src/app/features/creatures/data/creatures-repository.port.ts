import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { Creature, CreaturesCatalog } from '../domain/creatures.models';
import { CreateCreatureDto, UpdateCreatureDto } from './dto/creatures.dto';

export interface CreaturesRepository {
	loadCatalog(): Observable<CreaturesCatalog>;
	loadPublicCatalog(): Observable<CreaturesCatalog>;
	createCreature(command: CreateCreatureDto): Observable<Creature>;
	updateCreature(id: string, command: UpdateCreatureDto): Observable<Creature>;
	deleteCreature(id: string): Observable<void>;
}

export const CREATURES_REPOSITORY = new InjectionToken<CreaturesRepository>(
	'CREATURES_REPOSITORY'
);
