import { Provider } from '@angular/core';
import { CREATURES_REPOSITORY } from './creatures-repository.port';
import { HttpCreaturesRepository } from './http-creatures.repository';

export function provideCreaturesInfrastructure(): Provider[] {
	return [
		HttpCreaturesRepository,
		{
			provide: CREATURES_REPOSITORY,
			useExisting: HttpCreaturesRepository
		}
	];
}
