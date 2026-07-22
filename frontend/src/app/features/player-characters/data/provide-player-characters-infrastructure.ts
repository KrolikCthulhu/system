import { Provider } from '@angular/core';
import { HttpPlayerCharactersRepository } from './http-player-characters.repository';
import { PLAYER_CHARACTERS_REPOSITORY } from './player-characters-repository.port';

export function providePlayerCharactersInfrastructure(): Provider[] {
	return [
		HttpPlayerCharactersRepository,
		{
			provide: PLAYER_CHARACTERS_REPOSITORY,
			useExisting: HttpPlayerCharactersRepository
		}
	];
}
