import { Provider } from '@angular/core';
import { AUTH_REPOSITORY } from './auth-repository.port';
import { AUTH_SESSION_STORAGE } from './auth-session-storage.port';
import { HttpAuthRepository } from './http-auth.repository';
import { BrowserAuthSessionStorageService } from './token-storage.service';

export function provideAuthInfrastructure(): Provider[] {
	return [
		HttpAuthRepository,
		BrowserAuthSessionStorageService,
		{
			provide: AUTH_REPOSITORY,
			useExisting: HttpAuthRepository
		},
		{
			provide: AUTH_SESSION_STORAGE,
			useExisting: BrowserAuthSessionStorageService
		}
	];
}
