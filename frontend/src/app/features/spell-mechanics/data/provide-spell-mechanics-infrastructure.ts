import { Provider } from '@angular/core';
import { HttpSpellMechanicsRepository } from './http-spell-mechanics.repository';
import { SPELL_MECHANICS_REPOSITORY } from './spell-mechanics-repository.port';

export function provideSpellMechanicsInfrastructure(): Provider[] {
	return [
		HttpSpellMechanicsRepository,
		{
			provide: SPELL_MECHANICS_REPOSITORY,
			useExisting: HttpSpellMechanicsRepository
		}
	];
}
