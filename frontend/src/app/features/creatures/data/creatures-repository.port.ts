import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
	Creature,
	CreaturePublicCatalog,
	CreaturesCatalog
} from '../domain/creatures.models';
import { CreateCreatureDto, UpdateCreatureDto } from './dto/creatures.dto';

export interface CreaturesRepository {
	loadCatalog(): Observable<CreaturesCatalog>;
	loadPublicCatalog(): Observable<CreaturePublicCatalog>;
	createCreature(command: CreateCreatureDto): Observable<Creature>;
	updateCreature(id: string, command: UpdateCreatureDto): Observable<Creature>;
	deleteCreature(id: string): Observable<void>;
}

export const CREATURES_REPOSITORY = new InjectionToken<CreaturesRepository>(
	'CREATURES_REPOSITORY'
);
