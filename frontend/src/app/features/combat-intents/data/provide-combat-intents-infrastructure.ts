import { Provider } from '@angular/core';
import { COMBAT_INTENTS_REPOSITORY } from './combat-intents-repository.port';
import { HttpCombatIntentsRepository } from './http-combat-intents.repository';

export function provideCombatIntentsInfrastructure(): Provider[] {
	return [
		HttpCombatIntentsRepository,
		{
			provide: COMBAT_INTENTS_REPOSITORY,
			useExisting: HttpCombatIntentsRepository
		}
	];
}
