import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
	AnatomyScheme,
	AnatomySchemesCatalog
} from '../domain/anatomy-schemes.models';
import {
	CreateAnatomySchemeDto,
	UpdateAnatomySchemeDto
} from './dto/anatomy-schemes.dto';

export interface AnatomySchemesRepository {
	loadCatalog(): Observable<AnatomySchemesCatalog>;
	createScheme(command: CreateAnatomySchemeDto): Observable<AnatomyScheme>;
	updateScheme(
		id: string,
		command: UpdateAnatomySchemeDto
	): Observable<AnatomyScheme>;
	deleteScheme(id: string): Observable<void>;
}

export const ANATOMY_SCHEMES_REPOSITORY =
	new InjectionToken<AnatomySchemesRepository>('ANATOMY_SCHEMES_REPOSITORY');
