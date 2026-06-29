import { Provider } from '@angular/core';
import { CREATURE_TYPES_REPOSITORY } from './creature-types-repository.port';
import { HttpCreatureTypesRepository } from './http-creature-types.repository';

export function provideCreatureTypesInfrastructure(): Provider[] {
	return [
		HttpCreatureTypesRepository,
		{
			provide: CREATURE_TYPES_REPOSITORY,
			useExisting: HttpCreatureTypesRepository
		}
	];
}
