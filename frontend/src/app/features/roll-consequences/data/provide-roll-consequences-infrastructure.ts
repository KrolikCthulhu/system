import { Provider } from '@angular/core';
import { HttpRollConsequencesRepository } from './http-roll-consequences.repository';
import { ROLL_CONSEQUENCES_REPOSITORY } from './roll-consequences-repository.port';

export function provideRollConsequencesInfrastructure(): Provider[] {
	return [
		HttpRollConsequencesRepository,
		{
			provide: ROLL_CONSEQUENCES_REPOSITORY,
			useExisting: HttpRollConsequencesRepository
		}
	];
}
