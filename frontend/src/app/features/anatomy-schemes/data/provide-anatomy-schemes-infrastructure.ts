import { Provider } from '@angular/core';
import { ANATOMY_SCHEMES_REPOSITORY } from './anatomy-schemes-repository.port';
import { HttpAnatomySchemesRepository } from './http-anatomy-schemes.repository';

export function provideAnatomySchemesInfrastructure(): Provider[] {
	return [
		{
			provide: ANATOMY_SCHEMES_REPOSITORY,
			useClass: HttpAnatomySchemesRepository
		}
	];
}
