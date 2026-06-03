import { Provider } from '@angular/core';
import { GAME_EVENTS_REPOSITORY } from './game-events-repository.port';
import { HttpGameEventsRepository } from './http-game-events.repository';

export function provideGameEventsInfrastructure(): Provider[] {
	return [
		HttpGameEventsRepository,
		{
			provide: GAME_EVENTS_REPOSITORY,
			useExisting: HttpGameEventsRepository
		}
	];
}
