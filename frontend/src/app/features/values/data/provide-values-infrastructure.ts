import { Provider } from '@angular/core';
import { HttpValuesRepository } from './http-values.repository';
import { VALUES_REPOSITORY } from './values-repository.port';

export function provideValuesInfrastructure(): Provider[] {
	return [
		HttpValuesRepository,
		{
			provide: VALUES_REPOSITORY,
			useExisting: HttpValuesRepository
		}
	];
}
