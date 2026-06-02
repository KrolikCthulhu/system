import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { RollConsequence, RollConsequencesCatalog } from '../domain/roll-consequences.models';
import {
	CreateRollConsequenceCommand,
	UpdateRollConsequenceActiveCommand,
	UpdateRollConsequenceCommand
} from '../state/roll-consequences.commands';

export interface RollConsequencesRepository {
	loadCatalog(): Observable<RollConsequencesCatalog>;
	loadOptions(): Observable<RollConsequence[]>;
	load(id: string): Observable<RollConsequence>;
	create(command: CreateRollConsequenceCommand): Observable<RollConsequence>;
	update(command: UpdateRollConsequenceCommand): Observable<RollConsequence>;
	updateActive(command: UpdateRollConsequenceActiveCommand): Observable<RollConsequence>;
	delete(id: string): Observable<void>;
}

export const ROLL_CONSEQUENCES_REPOSITORY =
	new InjectionToken<RollConsequencesRepository>('ROLL_CONSEQUENCES_REPOSITORY');
