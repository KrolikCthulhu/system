import { Provider } from '@angular/core';
import { COMBAT_ENCOUNTERS_REPOSITORY } from './combat-encounters-repository.port';
import { HttpCombatEncountersRepository } from './http-combat-encounters.repository';

export function provideCombatEncountersInfrastructure(): Provider[] {
	return [
		HttpCombatEncountersRepository,
		{
			provide: COMBAT_ENCOUNTERS_REPOSITORY,
			useExisting: HttpCombatEncountersRepository
		}
	];
}
