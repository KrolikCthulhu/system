import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { handleApiError } from '../../../shared/http/api-error.util';
import { RollEventGraphDefinition } from '../../roll-consequences/domain/roll-event-graph.models';
import { GameEventHandler } from '../domain/game-events.models';
import {
	GameEventHandlerDto,
	GameEventHandlersResponseDto
} from './dto/game-events.dto';
import { GameEventsRepository } from './game-events-repository.port';
import { mapGameEventHandlerDto } from './mappers/game-events.mapper';

@Injectable({ providedIn: 'root' })
export class HttpGameEventsRepository implements GameEventsRepository {
	private readonly http = inject(HttpClient);
	private readonly baseUrl = environment.apiBaseUrl;

	loadRollPerformedHandlers(): Observable<GameEventHandler[]> {
		return this.http
			.get<GameEventHandlersResponseDto>(
				`${this.baseUrl}/admin/game-events/roll-performed/handlers`,
				{ withCredentials: true }
			)
			.pipe(
				map(response => response.handlers.map(mapGameEventHandlerDto)),
				catchError(handleApiError)
			);
	}

	updateHandlerGraph(
		id: string,
		graph: RollEventGraphDefinition | null
	): Observable<GameEventHandler> {
		return this.http
			.patch<GameEventHandlerDto>(
				`${this.baseUrl}/admin/game-events/handlers/${id}`,
				{ graph },
				{ withCredentials: true }
			)
			.pipe(
				map(mapGameEventHandlerDto),
				catchError(handleApiError)
			);
	}
}
