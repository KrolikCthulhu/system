import { Provider } from '@angular/core';
import { ATTRIBUTES_REPOSITORY } from './attributes-repository.port';
import { HttpAttributesRepository } from './http-attributes.repository';

export function provideAttributesInfrastructure(): Provider[] {
	return [
		HttpAttributesRepository,
		{
			provide: ATTRIBUTES_REPOSITORY,
			useExisting: HttpAttributesRepository
		}
	];
}
