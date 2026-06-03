import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import {
	ROLL_CONSEQUENCES_REPOSITORY,
	RollConsequencesRepository
} from '../../roll-consequences/data/roll-consequences-repository.port';
import { RollConsequence } from '../../roll-consequences/domain/roll-consequences.models';
import { RollEventGraphDefinition } from '../../roll-consequences/domain/roll-event-graph.models';
import {
	GAME_EVENTS_REPOSITORY,
	GameEventsRepository
} from '../data/game-events-repository.port';
import {
	createConsequenceHandlerItem,
	createGlobalHandlerItem,
	EventHandlerItem,
	GameEventHandler,
	RollPerformedHandlersCatalog
} from '../domain/game-events.models';

@Injectable({ providedIn: 'root' })
export class AdminEventsFacade {
	private readonly gameEventsRepository = inject<GameEventsRepository>(
		GAME_EVENTS_REPOSITORY
	);
	private readonly rollConsequencesRepository =
		inject<RollConsequencesRepository>(ROLL_CONSEQUENCES_REPOSITORY);

	loadRollPerformedHandlers(): Observable<RollPerformedHandlersCatalog> {
		return forkJoin({
			globalHandlers: this.gameEventsRepository.loadRollPerformedHandlers(),
			catalog: this.rollConsequencesRepository.loadCatalog()
		}).pipe(
			map(({ globalHandlers, catalog }) => ({
				globalHandlers,
				consequences: [...catalog.consequences].sort((first, second) => {
					const orderDiff = first.sortOrder - second.sortOrder;
					return orderDiff || first.name.localeCompare(second.name, 'ru');
				})
			}))
		);
	}

	saveHandlerGraph(
		handler: EventHandlerItem,
		graph: RollEventGraphDefinition | null
	): Observable<EventHandlerItem> {
		if (handler.type === 'global') {
			return this.gameEventsRepository
				.updateHandlerGraph(handler.id, graph)
				.pipe(map(createGlobalHandlerItem));
		}

		return this.rollConsequencesRepository
			.update({
				id: handler.source.id,
				name: handler.source.name,
				description: handler.source.description,
				rollEventGraph: graph,
				isActive: handler.source.isActive,
				sortOrder: handler.source.sortOrder,
				values: handler.source.values.map(value => ({
					id: value.id,
					name: value.name,
					description: value.description,
					isActive: value.isActive,
					sortOrder: value.sortOrder
				}))
			})
			.pipe(map(createConsequenceHandlerItem));
	}

	replaceSavedHandler(
		params: {
			globalHandlers: readonly GameEventHandler[];
			consequences: readonly RollConsequence[];
		},
		saved: EventHandlerItem
	) {
		if (saved.type === 'global') {
			return {
				globalHandlers: params.globalHandlers.map(handler =>
					handler.id === saved.id ? saved.source : handler
				),
				consequences: params.consequences
			};
		}

		return {
			globalHandlers: params.globalHandlers,
			consequences: params.consequences.map(consequence =>
				consequence.id === saved.id ? saved.source : consequence
			)
		};
	}
}
