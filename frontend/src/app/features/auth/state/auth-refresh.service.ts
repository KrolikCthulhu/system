import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
	Observable,
	catchError,
	finalize,
	map,
	shareReplay,
	tap,
	throwError
} from 'rxjs';
import { environment } from '../../../infrastructure/config/environment';
import { extractApiErrorMessage } from '../data/auth-http-error.util';
import { AuthSessionDto } from '../data/dto/auth.dto';
import { mapAuthSessionDto } from '../data/mappers/auth.mapper';
import { AuthSession } from '../domain/auth.models';
import { AuthSessionService } from './auth-session.service';

@Injectable({ providedIn: 'root' })
export class AuthRefreshService {
	private readonly http = new HttpClient(inject(HttpBackend));
	private readonly authSession = inject(AuthSessionService);
	private readonly baseUrl = environment.apiBaseUrl;

	private refreshRequest$: Observable<AuthSession> | null = null;

	refreshSession(): Observable<AuthSession> {
		if (this.refreshRequest$) {
			return this.refreshRequest$;
		}

		const request$ = this.http
			.post<AuthSessionDto>(
				`${this.baseUrl}/auth/refresh`,
				{},
				{
					withCredentials: true
				}
			)
			.pipe(
				map(mapAuthSessionDto),
				tap(session => {
					this.authSession.setSession(session);
				}),
				catchError(error => {
					this.authSession.clearSession();

					return throwError(() => new Error(extractApiErrorMessage(error)));
				}),
				finalize(() => {
					this.refreshRequest$ = null;
				}),
				shareReplay({ bufferSize: 1, refCount: false })
			);

		this.refreshRequest$ = request$;

		return request$;
	}
}
