import { Provider } from '@angular/core';
import { HttpSystemCombatActionsRepository } from './http-system-combat-actions.repository';
import { SYSTEM_COMBAT_ACTIONS_REPOSITORY } from './system-combat-actions-repository.port';

export function provideSystemCombatActionsInfrastructure(): Provider[] {
	return [
		HttpSystemCombatActionsRepository,
		{
			provide: SYSTEM_COMBAT_ACTIONS_REPOSITORY,
			useExisting: HttpSystemCombatActionsRepository
		}
	];
}
