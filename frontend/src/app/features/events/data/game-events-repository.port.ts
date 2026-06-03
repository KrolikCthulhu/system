import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { RollEventGraphDefinition } from '../../roll-consequences/domain/roll-event-graph.models';
import { GameEventHandler } from '../domain/game-events.models';

export interface GameEventsRepository {
	loadRollPerformedHandlers(): Observable<GameEventHandler[]>;
	updateHandlerGraph(
		id: string,
		graph: RollEventGraphDefinition | null
	): Observable<GameEventHandler>;
}

export const GAME_EVENTS_REPOSITORY = new InjectionToken<GameEventsRepository>(
	'GAME_EVENTS_REPOSITORY'
);
