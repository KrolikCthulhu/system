import { Provider } from '@angular/core';
import { HttpProgressionPresetsRepository } from './http-progression-presets.repository';
import { PROGRESSION_PRESETS_REPOSITORY } from './progression-presets-repository.port';

export function provideProgressionPresetsInfrastructure(): Provider[] {
	return [
		HttpProgressionPresetsRepository,
		{
			provide: PROGRESSION_PRESETS_REPOSITORY,
			useExisting: HttpProgressionPresetsRepository
		}
	];
}
