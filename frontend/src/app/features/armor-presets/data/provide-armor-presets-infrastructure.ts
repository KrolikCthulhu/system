import { Provider } from '@angular/core';
import { ARMOR_PRESETS_REPOSITORY } from './armor-presets-repository.port';
import { HttpArmorPresetsRepository } from './http-armor-presets.repository';

export function provideArmorPresetsInfrastructure(): Provider[] {
	return [
		HttpArmorPresetsRepository,
		{
			provide: ARMOR_PRESETS_REPOSITORY,
			useExisting: HttpArmorPresetsRepository
		}
	];
}
