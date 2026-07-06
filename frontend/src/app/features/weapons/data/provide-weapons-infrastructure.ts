import { Provider } from '@angular/core';
import { HttpWeaponsRepository } from './http-weapons.repository';
import { WEAPONS_REPOSITORY } from './weapons-repository.port';

export function provideWeaponsInfrastructure(): Provider[] {
	return [
		HttpWeaponsRepository,
		{
			provide: WEAPONS_REPOSITORY,
			useExisting: HttpWeaponsRepository
		}
	];
}
