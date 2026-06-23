import { Provider } from '@angular/core';
import { CONDITIONS_REPOSITORY } from './conditions-repository.port';
import { HttpConditionsRepository } from './http-conditions.repository';

export function provideConditionsInfrastructure(): Provider[] {
	return [
		HttpConditionsRepository,
		{
			provide: CONDITIONS_REPOSITORY,
			useExisting: HttpConditionsRepository
		}
	];
}
