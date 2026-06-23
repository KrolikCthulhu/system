import { Provider } from '@angular/core';
import { DAMAGE_TYPES_REPOSITORY } from './damage-types-repository.port';
import { HttpDamageTypesRepository } from './http-damage-types.repository';

export function provideDamageTypesInfrastructure(): Provider[] {
	return [
		HttpDamageTypesRepository,
		{
			provide: DAMAGE_TYPES_REPOSITORY,
			useExisting: HttpDamageTypesRepository
		}
	];
}
