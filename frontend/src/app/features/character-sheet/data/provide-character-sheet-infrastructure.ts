import { Provider } from '@angular/core';
import { CHARACTER_SHEET_SANDBOX_REPOSITORY } from './character-sheet-sandbox-repository.port';
import { HttpCharacterSheetSandboxRepository } from './http-character-sheet-sandbox.repository';

export function provideCharacterSheetInfrastructure(): Provider[] {
	return [
		HttpCharacterSheetSandboxRepository,
		{
			provide: CHARACTER_SHEET_SANDBOX_REPOSITORY,
			useExisting: HttpCharacterSheetSandboxRepository
		}
	];
}
